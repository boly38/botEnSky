import axios from "axios";
import {isSet, nowISO8601, nowMinusHoursUTCISO, toHuman, toHumanDay, toHumanTime} from "../lib/Common.js";
import {NEWS_LABEL} from "../services/NewsService.js";

/**
 * autonomous gist : https://gist.github.com/boly38/e853a1d83b63481fd5a97e4b7822813e
 */
export default class LogtailService {
    constructor(config, loggerService) {
        this.config = config;
        this.tz = config.tz;
        this.logger = loggerService.getLogger().child({label: 'LogtailService'});
        this.logtail_api_v1 = config.log?.logtailApiV1;
        this.logtail_api_v2 = config.log?.logtailApiV2;
        this.logtail_api_token = config.log?.logtailApiToken;
        this.logtail_source_id = config.log?.logtailSourceId;
        if (isSet(this.logtail_api_v1) && isSet(this.logtail_api_token) && isSet(this.logtail_source_id)) {
            this.logtailClientV1 = axios.create({
                baseURL: this.logtail_api_v1,
                timeout: 30000,
                headers: {'Authorization': `Bearer ${this.logtail_api_token}`}
            });
        }
        if (isSet(this.logtail_api_v2) && isSet(this.logtail_api_token) && isSet(this.logtail_source_id)) {
            this.logtailClientV2 = axios.create({
                baseURL: this.logtail_api_v2,
                timeout: 30000,
                headers: {'Authorization': `Bearer ${this.logtail_api_token}`}
            });
        }
    }

    isAvailable() {
        return isSet(this.logtailClientV1);
    }

    querySource(sourceIds/* coma separated ids */, query, from, to, batch = 100) {
        const service = this;
        return new Promise((resolve, reject) => {
            // query source(s) via v2 /query/live-tail - https://betterstack.com/docs/logs/query-api/v2/live-tail/
            service.logtailClientV2.get('/query/live-tail', {params: {source_ids: sourceIds, query, from, to, batch}})
                .then(res => resolve(res?.data))
                .catch(res => reject(res));
        });
    }

    perDateMessage(logs) {
        const {tz} = this
        const resultMap = {};
        logs.forEach(d => {
            const dt = toHumanTime(d.dt, tz);
            const day = toHumanDay(d.dt, tz);
            const message = d.message || d.msg;
            if (!resultMap[day]) {
                resultMap[day] = [];
            }
            resultMap[day].push({dt,message});
        });
        return resultMap;
    }

    getRecentNews() {
        const service = this;
        const {logger, tz} = this
        return new Promise((resolve, reject) => {
            const logtail_source_id = this.logtail_source_id;
            const from = nowMinusHoursUTCISO(3 * 24);//now - 3 days
            const to = nowISO8601();//now
            // query syntax : https://betterstack.com/docs/logs/using-logtail/live-tail-query-language/
            const query = `label:"${NEWS_LABEL}"`;
            logger.debug(`querySource id=${logtail_source_id}, query=${query}, from=${from} to=${to} tz=${tz}`);
            service.querySource(logtail_source_id, query, from, to)
                .then(result => {
                    const data = this.perDateMessage(result.data);
                    const logtailNews = {
                        "from": toHuman(from, tz),
                        "to": toHuman(to, tz),
                        data
                    };
                    logger.debug(`result news ${logtailNews.data?.length}`);
                    resolve(logtailNews);
                })
                .catch(reject);
        });
    }
}