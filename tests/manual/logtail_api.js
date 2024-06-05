// gist / https://gist.github.com/boly38/e853a1d83b63481fd5a97e4b7822813e
const logtail_api_token = process.env.LOGTAIL_API_TOKEN;

// Source NAME - get it from source config UI : "Basic" > "Source ID" - it's a  name not an int
const logtail_source_name = process.env.LOGTAIL_SOURCE_NAME;

// Source ID - get it from source url, or from results of get sources api - it's an int
const logtail_source_id = process.env.LOGTAIL_SOURCE_ID;

// Import Axios
import axios from 'axios';
import dayjs from "dayjs";

const logtailApiV1 = axios.create({
    baseURL: 'https://logs.betterstack.com/api/v1',
    timeout: 30000,
    headers: {'Authorization': `Bearer ${logtail_api_token}`}
});

const getSourcesList = () => {
    return new Promise((resolve, reject) => {
        // list sources - https://betterstack.com/docs/logs/api/list-all-existing-sources/
        logtailApiV1.get('/sources')
            //https://axios-http.com/fr/docs/res_schema
            .then(res => resolve(res?.data?.data))
            .catch(reject);
    });
}
/**
 * @param tableName - Source ID (get it from source config UI)
 * @returns {Promise<unknown>}
 */
const getSourceByTableName = tableName => {
    return new Promise((resolve, reject) => {
        getSourcesList()
            .then(sources => {
                resolve(sources.filter(s => s?.attributes?.table_name === tableName));
            })
            .catch(res => reject(res));
    });
}

const getSourceByTableNameAndLogResult = name => getSourceByTableName(name)
    .then(logtailSource => {
        console.log(JSON.stringify(logtailSource, null, 2))
    })
    .catch(console.error)

const querySource = (sourceIds/* coma separated ids */, query, from, to, batch = 100) => {
    return new Promise((resolve, reject) => {
        // query source(s) - https://betterstack.com/docs/logs/query-api/
        logtailApiV1.get('/query', {params: {source_ids: sourceIds, query, from, to, batch}})
            .then(res => resolve(res?.data))
            .catch(res => reject(res));
    });
}
const querySourceAndLogResult = (sourceIds, query, from, to) => querySource(sourceIds, query, from, to)
    .then(result => {
        console.log(JSON.stringify(result.data.map(d => `${d.dt} - ${d.message}`), null, 2))
    })
    .catch(axiosError => {
        if (axiosError.response) {
            console.log(axiosError.response.status);
            console.log(axiosError.response.statusText);
            console.log(axiosError.response.data);
        }
        console.log(axiosError.message);
    })
export const nowISO = () => dayjs().toISOString()
export const nowMinusHoursISO = (nbHours = 1) => dayjs().subtract(nbHours, 'hour').toISOString()

if (logtail_source_name) {
    console.log("getSourceByTableName", logtail_source_name);
    await getSourceByTableNameAndLogResult(logtail_source_name);
}

if (logtail_source_id) {
    // default from is 30 min
    const from = nowMinusHoursISO(2 * 24);//now - 2 days
    const to = nowISO();//now
    // query syntax : https://betterstack.com/docs/logs/using-logtail/live-tail-query-language/
    const query = "label:\"News 📢\"";
    console.log(`querySource id=${logtail_source_id}, query=${query}, from=${from} to=${to}`);
    await querySourceAndLogResult(logtail_source_id, query, from, to);
}