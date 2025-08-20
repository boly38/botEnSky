/**
 * source: https://gist.github.com/boly38/b3b41ad48c41a9e58dde577e39a0d48f
 * This NodeJs example file is an autonomous script
 * that query betterstack telemetry api (historically called logtail)
 * https://betterstack.com/docs/logs/api/
 *
 * Usage example (update with YOUR values):
 *   export LOG_BETTERSTACK_SOURCE_TABLE_NAME=mySource_dev
 *   export LOG_BETTERSTACK_SOURCE_ID=7654321
 *   export LOG_BETTERSTACK_API_HTTP_REMOTELY_ENDPOINT=https://eu-REPLACE_ME-connect.betterstackdata.com
 *   export LOG_BETTERSTACK_API_HTTP_USERNAME="utXXXXXXXXXXXXXXXXXXXXXXXXX"
 *   export LOG_BETTERSTACK_API_HTTP_PASSWORD="vHXXXXXXXXXXXXXXXXXXXXXXXXX"
 *   export LOG_BETTERSTACK_TEAM_ID=654321
 *   # then use token based api :
 *   node ./betterstack_api.js sources
 *   # then use remote http endpoint based api :
 *   node ./betterstack_api.js logs
 */
// Import Axios
import axios from 'axios';

// API Token - https://betterstack.com/settings/global-api-tokens (team pan)
const betterstack_api_token = process.env.LOG_BETTERSTACK_API_TOKEN;

// API "Connect remotely via HTTP" // Dashboard > Connect remotely
// https://telemetry.betterstack.com/team/t<teamID>/dashboards/connections
const betterstack_remotely_http_endpoint = process.env.LOG_BETTERSTACK_API_HTTP_REMOTELY_ENDPOINT + "?output_format_pretty_row_numbers=0";
const betterstack_api_username = process.env.LOG_BETTERSTACK_API_HTTP_USERNAME;
const betterstack_api_password = process.env.LOG_BETTERSTACK_API_HTTP_PASSWORD;

// Dashboard > Sources
// https://telemetry.betterstack.com/team/t<teamID>/sources
// Source NAME - get it from source config UI : "Basic" > "Source ID" - it's a name not an int
const betterstack_source_table_name = process.env.LOG_BETTERSTACK_SOURCE_TABLE_NAME;
// Source ID - get it from source url, or from results of get sources api - it's an int
// https://telemetry.betterstack.com/team/t<teamID>/sources/<sourceID>/data-ingestion
// unused // const betterstack_source_id = process.env.LOG_BETTERSTACK_SOURCE_ID;

// Team ID - get it from source url or fetch source request
const betterstack_team_id = process.env.LOG_BETTERSTACK_TEAM_ID;

// action to do as first cmd line argument (node script.js <action>)
const action = process.argv[2];
const betterstackDebug = process.env.BETTERSTACK_DEBUG === 'true';

// Telemetry client for source API
// https://betterstack.com/docs/logs/api/list-all-existing-sources/
const betterstackTelemetryTokenBasedApi = betterstack_api_token ? axios.create({
    baseURL: 'https://telemetry.betterstack.com/api',
    timeout: 30000,
    headers: {'Authorization': `Bearer ${betterstack_api_token}`}
}) : {"error": "expect LOG_BETTERSTACK_API_TOKEN to be set, cf. https://betterstack.com/settings/global-api-tokens"};

// Telemetry client for query API - 'Connect remotely via HTTP API' - fetch logs
// https://betterstack.com/docs/logs/query-api/connect-remotely/
let basic64Auth = Buffer.from(`${betterstack_api_username}:${betterstack_api_password}`).toString('base64');
const betterstackQueryClient = betterstack_api_username && betterstack_api_password && betterstack_remotely_http_endpoint ?
        axios.create({
            baseURL: betterstack_remotely_http_endpoint,
            timeout: 30000,
            headers: {
                'Authorization': 'Basic ' + basic64Auth,
                'Content-type': 'plain/text'
            }
        }) : betterstack_remotely_http_endpoint ? {"error": "expect LOG_BETTERSTACK_API_HTTP_USERNAME and LOG_BETTERSTACK_API_HTTP_PASSWORD to be set, cf. Betterstack > Dashboard > Connect remotely"}
         : {"error": "expect LOG_BETTERSTACK_API_HTTP_REMOTELY_ENDPOINT to be set"};


// https://betterstack.com/docs/logs/api/list-all-existing-sources/
const getSourcesList = () => {
    return new Promise((resolve, reject) => {
        if (betterstackTelemetryTokenBasedApi.error) {
            throw new Error(betterstackTelemetryTokenBasedApi.error);
        }
        // list sources - https://betterstack.com/docs/logs/api/list-all-existing-sources/
        betterstackTelemetryTokenBasedApi.get('/v1/sources')
            //https://axios-http.com/fr/docs/res_schema
            .then(res => resolve(res?.data?.data))
            .catch(reject);
    });
}
/**
 * @param sourceIdTableNaùe - Source ID (get it from source config UI)
 * @returns {Promise<unknown>}
 */
const getSourceByTableName = sourceIdTableNaùe => {
    return new Promise((resolve, reject) => {
        getSourcesList()
            .then(sources => {
                resolve(sources.filter(s => s?.attributes?.table_name === sourceIdTableNaùe));
            })
            .catch(res => reject(res));
    });
}

const getSourceByTableNameAndLogResult = () => {
    if (betterstack_source_table_name === undefined) {
        throw new Error("expect LOG_BETTERSTACK_SOURCE_TABLE_NAME environment variable to be defined")
    }
    console.log(`getSourceByTableName ${betterstack_source_table_name}`);
    getSourceByTableName(betterstack_source_table_name)
        .then(logtailSource => {
            console.log(JSON.stringify(logtailSource, null, 2))
        })
        .catch(console.error);
}

// https://betterstack.com/docs/logs/query-api/connect-remotely/
const telemetryHttpQuery = (requestBody) => {
    if (betterstackQueryClient.error) {
        throw new Error(betterstackQueryClient.error);
    }
    return new Promise((resolve, reject) => {
        const url = "";
        const options = {};
        betterstackDebug && console.log(`POST ${url}\n${requestBody}`)
        betterstackQueryClient.post(url, requestBody, options)
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

// query provided by betterstack.com/docs where result is on how to query api :)
const queryExample = (teamId, sourceTableName) => {
    const bodyQuery = `
        SELECT query_collection || '_' || type AS named_collection, 
           multiIf( 
             type = 'logs', 'SELECT dt, raw FROM remote(' || query_collection || '_logs) LIMIT 10 UNION ALL SELECT dt, raw FROM s3Cluster(primary, ' || query_collection || '_s3) WHERE _row_type = 1 LIMIT 10', 
             type = 'spans', 'SELECT dt, raw FROM remote(' || query_collection || '_spans) LIMIT 10 UNION ALL SELECT dt, raw FROM s3Cluster(primary, ' || query_collection || '_s3) WHERE _row_type = 3 LIMIT 10', 
             type = 'metrics', 'SELECT toStartOfHour(dt) AS time, countMerge(events_count) FROM remote(' || query_collection || '_metrics) GROUP BY time ORDER BY time DESC LIMIT 10', null ) AS query_with 
                                 FROM VALUES('query_collection String, type String', ('t${teamId}_${sourceTableName}', 'logs'), ('t${teamId}_${sourceTableName}', 'metrics')
           ) ORDER BY named_collection FORMAT Pretty
        `;
    return telemetryHttpQuery(bodyQuery);
}

// https://betterstack.com/docs/logs/query-api/connect-remotely/
// retrieve last 10 logs order by date desc
const queryLogs = (teamId, sourceTableName) => {
    // TODO : from, to, batch
    const selectFields = `dt, 
          getJSON(raw, 'level') as level,
          getJSON(raw, 'label') as label,
          getJSON(raw, 'message') as message 
        `;
    const limit = "10";
    let orderAndLimit = `ORDER BY dt DESC LIMIT ${limit}`;
    const bodyQuery = `
            SELECT ${selectFields} FROM remote(t${teamId}_${sourceTableName}_logs) ${orderAndLimit} 
            UNION ALL 
            SELECT ${selectFields} FROM s3Cluster(primary, t${teamId}_${sourceTableName}_s3) WHERE _row_type = 1 ${orderAndLimit}
            FORMAT JSON
        `;
    /*
    Note to retrieve sub object attributes ex. {"context":{"runtime":{"file":"xxx"}}}
        "file": "node_modules\@logtail\winston\dist\cjs\winston.js",
        "type": "LogtailTransport",
    must be translated into something like this :
      getJSON(raw, 'context.runtime.file') as file,
      getJSON(raw, 'context.runtime.line') as line,
      getJSON(raw, 'context.runtime.column') as column
     */
//         WHERE raw LIKE '%My text%'
    return telemetryHttpQuery(bodyQuery);
}

// retrieve last <limit> logs order by date desc where date is in range fromTs..toTs
const queryRecentLogs = (teamId, sourceTableName, fromTs, toTs, rawContains = "", limit = 1000) => {
    const selectFields = `dt,
          getJSON(raw, 'level') as level,
          getJSON(raw, 'label') as label,
          getJSON(raw, 'message') as message 
        `;
    const dateRangeCriteria = ` dt BETWEEN toDateTime64(${fromTs}, 0, 'UTC') AND toDateTime64(${toTs}, 0, 'UTC')`;
    const andRawCriteria = rawContains !== "" ? ` AND raw LIKE '%${rawContains}%'` : ``;
    let orderAndLimit = `ORDER BY dt DESC LIMIT ${limit}`;
    const bodyQuery = `
            SELECT ${selectFields} FROM remote(t${teamId}_${sourceTableName}_logs) 
            WHERE ${dateRangeCriteria} ${andRawCriteria} ${orderAndLimit} 
            UNION ALL 
            SELECT ${selectFields} FROM s3Cluster(primary, t${teamId}_${sourceTableName}_s3) 
            WHERE _row_type = 1 AND ${dateRangeCriteria} ${andRawCriteria} ${orderAndLimit}
            FORMAT JSON
        `;
    return telemetryHttpQuery(bodyQuery);
}

// retrieve metrics count per hour limit 10
const queryMetrics = (teamId, sourceTableName) => {
    const bodyQuery = `
            SELECT toStartOfHour(dt) AS time, countMerge(events_count) 
            FROM remote(t${teamId}_${sourceTableName}_metrics) 
            GROUP BY time 
            ORDER BY time DESC 
            LIMIT 10
        `;
    // NB/ not so much example on official website about metrics
    // https://betterstack.com/docs/logs/query-api/connect-remotely/#basic-usage
    return telemetryHttpQuery(bodyQuery);
}


// -------------------------
const sourceIsSet = betterstack_team_id && betterstack_source_table_name;
let supportedActions = sourceIsSet ? ["sources","source","example","logs","recent2hLogs","recent24hLogs","metrics"]
        :["sources","source"];

if (action === undefined || !supportedActions.includes(action)) {
    console.log(`please specify an action : ${supportedActions}\nexample:\n\tnode ${process.argv[1]} sources`)
} else if (action === "sources") {
    const sources = await getSourcesList()
    console.log(`getSourcesList :\n${JSON.stringify(sources, null, 2)}`);
} else if (action === "source") {
    getSourceByTableNameAndLogResult();
} else if (sourceIsSet && action === "example") {
    queryExample(betterstack_team_id, betterstack_source_table_name)
        .then(console.log)
        .catch(err => console.error(err?.messsage || err));
} else if (sourceIsSet && action === "logs") {
    queryLogs(betterstack_team_id, betterstack_source_table_name)
        .then(result => console.log(result))
        .catch(err => console.error(err?.messsage || err));
} else if (sourceIsSet && ["recent24hLogs","recent2hLogs"].includes(action)) {
    // last 24 h logs
    let last24hInMs = 24 * 60 * 60 * 1000;
    let last2hInMs = 2 * 60 * 60 * 1000;
    const minWindow = "recent24hLogs" === action ? last24hInMs : last2hInMs;
    const fromTs = Math.floor((Date.now() - minWindow) / 1000);
    const toTs = Math.floor(Date.now() / 1000);
    const msgContains = "";
    // const msgContains = "News 📢";
    queryRecentLogs(betterstack_team_id, betterstack_source_table_name, fromTs, toTs, msgContains)
        .then(console.log)
        .catch(err => console.error(err?.messsage || err));
} else if (sourceIsSet && action === "metrics") {
    queryMetrics(betterstack_team_id, betterstack_source_table_name)
        .then(console.log)
        .catch(err => console.error(err?.messsage || err));
} else if (!sourceIsSet) {
    console.log(`current env cant trigger wanted action ${action}, please setup env.`)
}

