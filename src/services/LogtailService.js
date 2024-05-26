import axios from "axios";
import {isSet, nowISO8601, nowMinusHoursUTCISO, toHuman} from "../lib/Common.js";
import {NEWS_LABEL} from "./NewsService.js";

/**
 * autonomous gist : https://gist.github.com/boly38/e853a1d83b63481fd5a97e4b7822813e
 */
export default class LogtailService {
    constructor(config, loggerService) {
        this.config = config;
        this.tz = config.tz;
        this.logger = loggerService.getLogger().child({label: 'LogtailService'});
        this.logtail_api_v1 = config.log?.logtailApiV1;
        this.logtail_api_token = config.log?.logtailApiToken;
        this.logtail_source_id = config.log?.logtailSourceId;
        if (isSet(this.logtail_api_v1) && isSet(this.logtail_api_token) && isSet(this.logtail_source_id))
        this.logtailApiV1 = axios.create({
            baseURL: this.logtail_api_v1,
            timeout: 30000,
            headers: {'Authorization': `Bearer ${this.logtail_api_token}`}
        });
    }

    isAvailable() {
        return isSet(this.logtail_api_v1);
    }

    querySource(sourceIds/* coma separated ids */, query, from, to, batch = 100) {
        return new Promise((resolve, reject) => {
            // query source(s) - https://betterstack.com/docs/logs/query-api/
            this.logtailApiV1.get('/query', {params: {source_ids: sourceIds, query, from, to, batch}})
                .then(res => resolve(res?.data))
                .catch(res => reject(res));
        });
    }

    getRecentNews() {
        const {logger, tz} = this
        return new Promise((resolve, reject) => {
            const logtail_source_id = this.logtail_source_id;
            const from = nowMinusHoursUTCISO(3 * 24);//now - 3 days
            const to = nowISO8601();//now
            // query syntax : https://betterstack.com/docs/logs/using-logtail/live-tail-query-language/
            const query = `label:"${NEWS_LABEL}"`;
            logger.debug(`querySource id=${logtail_source_id}, query=${query}, from=${from} to=${to} tz=${tz}`);
            this.querySource(logtail_source_id, query, from, to)
                .then(result => {
                    const data = result.data.map(d => {
                        return {"dt": toHuman(d.dt, tz), "message": d.message}
                    });
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