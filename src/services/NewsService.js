import {isSet, nowHuman, nowISO8601, toHuman} from "../lib/Common.js";
import {cacheEvictKey, cacheGetTtlObject} from "../lib/MemoryCache.js";
import {setTimeout} from 'node:timers/promises';// https://nodejs.org/api/timers.html#settimeoutcallback-delay-args

export const NEWS_LABEL = "News 📢";
export const NEWS_CACHE_KEY = "cache:news";
export const ONE_DAY_SECOND = 60 * 60 * 24;
export default class NewsService {
    constructor(loggerService, logtailService) {
        this.max = 30;
        this.since = nowISO8601();
        this.lastNews = [];
        this.logtailService = logtailService;
        this.loggerNews = loggerService.getLogger().child({label: NEWS_LABEL});
        this.loggerService = loggerService.getLogger().child({label: 'NewsService'});
    }

    addNewsEntry(dt, msg) {
        this.lastNews.splice(0, 0, {dt, msg});
        if (this.lastNews.length > this.max) {
            this.lastNews.splice(this.lastNews.length - 1, 1);
        }
    }

    add(news) {
        let dt = nowISO8601();
        this.addNewsEntry(dt, news);
        this.loggerNews.info(news);
        setTimeout(5000, NEWS_CACHE_KEY)
            .then(cacheEvictKey);// wait a few seconds to get all logs recorded on logtail side
    }

    getNews() {
        const {loggerService, logtailService, since, lastNews} = this;
        return new Promise(resolve => {
            const to = nowHuman();
            const oldSchoolNews = {"since": toHuman(since), to, "data": lastNews};
            oldSchoolNews.data = logtailService.perDateMessage(oldSchoolNews.data);
            if (!logtailService.isAvailable()) {
                loggerService.debug(`logtailService is not available`);
                return resolve(oldSchoolNews);
            }
            cacheGetTtlObject(NEWS_CACHE_KEY, ONE_DAY_SECOND, logtailService.getRecentNews.bind(logtailService))
                .then(cacheNews => {
                    return isSet(cacheNews) ? resolve(cacheNews) : resolve(oldSchoolNews);
                })
                .catch(err => {
                    loggerService.error(`unable to retrieve cached logtail news : ${err.message} - fallback using in-memory news`);
                    return resolve(oldSchoolNews);
                });
        });
    }


}