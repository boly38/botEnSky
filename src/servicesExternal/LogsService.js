import axios from "axios";
import {getUtcTimestampWithDelta, isSet, toHumanDay, toHumanFromSecond, toHumanTime} from "../lib/Common.js";
import {NEWS_LABEL} from "../services/NewsService.js";

/**
 * Collect historical and recent applicative logs
 * - via external Betterstack API (historically called 'logtail')
 * ---
 * (deprecated v1) autonomous gist : https://gist.github.com/boly38/e853a1d83b63481fd5a97e4b7822813e
 * TODO: fresh gist
 */
export default class LogsService {
    constructor(config, loggerService) {
        this.config = config;
        this.tz = config.tz;
        this.logger = loggerService.getLogger().child({label: 'LogsService'});
        this.initBetterstack();
    }

    initBetterstack() {
        this.betterstackQueryClient = null;
        const {
            betterstackDebug,
            // betterstackSourceToken // used by LoggerService
            betterstackHttpRemotelyEndpoint,
            betterstackHttpUsername,
            betterstackHttpPassword,
            betterstackTeamId,
            betterstackSourceTableName
        } = this.config.log
        if (isSet(betterstackHttpRemotelyEndpoint) && isSet(betterstackHttpUsername) && isSet(betterstackHttpPassword)) {
            // https://betterstack.com/docs/logs/query-api/connect-remotely/
            let basic64Auth = Buffer
                .from(`${betterstackHttpUsername}:${betterstackHttpPassword}`)
                .toString('base64');
            this.betterstackQueryClient = axios.create({
                baseURL: betterstackHttpRemotelyEndpoint + "?output_format_pretty_row_numbers=0",
                timeout: 30000,
                headers: {
                    'Authorization': 'Basic ' + basic64Auth,
                    'Content-type': 'plain/text'
                }
            });
            this.betterstackDebug = betterstackDebug;
            this.betterstackTeamId = betterstackTeamId;
            this.betterstackSourceTableName = betterstackSourceTableName;
        } else {
            this.betterstackError = "betterstack client is not set, please review server config."
        }

    }

    isAvailable() {
        return isSet(this.betterstackQueryClient) && !isSet(this.betterstackError);
    }

    telemetryQuery(requestBody){
        if (this.betterstackError) {
            throw new Error(this.betterstackError);
        }
        return new Promise((resolve, reject) => {
            const url = "";
            const options = {};
            this.betterstackDebug && console.log(`telemetryQuery POST ${url}\n${requestBody}`)
            this.betterstackQueryClient.post(url, requestBody, options)
                .then(res => resolve(res?.data?.data || res?.data))
                .catch(error => {
                    if (error.message) {
                        console.log(`error:${error.message}`);
                    }
                    reject({
                        message: error.message,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data
                    })
                });
        });
    }

    // retrieve last <limit> logs order by date desc where date is in range fromTs..toTs
    queryLogs(teamId, sourceTableName, fromTs, toTs, labelContains = '', limit = 10) {
        const {logger} = this
        logger.debug(`queryLogs teamId=${teamId}, sourceTableName=${sourceTableName}, fromTs=${fromTs}, toTs=${toTs}, limit=${limit}`);
        const selectFields = `dt, 
          getJSON(raw, 'level') as level,
          getJSON(raw, 'label') as label,
          getJSON(raw, 'message') as message 
        `;
        const dateRangeCriteria = ` dt BETWEEN toDateTime64(${fromTs}, 0, 'UTC') AND toDateTime64(${toTs}, 0, 'UTC')`;
        const andLabelCriteria = labelContains !== "" ? ` AND label LIKE '%${labelContains}%'` : ``;
        let orderAndLimit = `ORDER BY dt DESC LIMIT ${limit}`;
        const bodyQuery = `
            SELECT ${selectFields} FROM remote(t${teamId}_${sourceTableName}_logs) 
            WHERE ${dateRangeCriteria} ${andLabelCriteria} ${orderAndLimit} 
            UNION ALL 
            SELECT ${selectFields} FROM s3Cluster(primary, t${teamId}_${sourceTableName}_s3) 
            WHERE _row_type = 1 AND ${dateRangeCriteria}${andLabelCriteria} ${orderAndLimit}
            FORMAT JSON
        `;
//         WHERE raw LIKE '%My text%'
        return this.telemetryQuery(bodyQuery);
    }

    /**
     * result: {"from": "ISODATE", "to": "ISODATE", "data" : { "ISODATE": {}, "ISODATE2": {}}}
     */
    getRecentNews() {
        const {tz} = this
        const service = this;
        return new Promise((resolve, reject) => {
            const fromTs = getUtcTimestampWithDelta(-3);
            const endTs = getUtcTimestampWithDelta(0);//now
            const limit = 100; // a limit is recommended by betterstack
            const labelContains = `${NEWS_LABEL}`;
            service.queryLogs(
                this.betterstackTeamId, this.betterstackSourceTableName,
                fromTs, endTs, labelContains, limit
            )
                .then(logsEntry => {
                    const data = this.perDateMessage(logsEntry);
                    const newsLogs = {
                        "from": toHumanFromSecond(fromTs, tz),
                        "to": toHumanFromSecond(endTs, tz),
                        data
                    };
                    // DEBUG // console.log(`result news ${Object.keys(newsLogs?.data)?.length}`);
                    resolve(newsLogs);
                })
                .catch(err => reject(err));
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
            resultMap[day].push({dt, message});
        });
        return resultMap;
    }

}