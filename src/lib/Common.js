import path from 'node:path';
import fs from 'node:fs';
import process from "node:process";
import dayjs from "dayjs";

export const BES_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";
const __dirname = path.resolve();

export const readSync = projectFilePath => {
    const finalFilename = projectFilePath.startsWith('./') ?
        __dirname + '/' + projectFilePath.substring(2) :
        projectFilePath;
    return fs.readFileSync(finalFilename, 'utf8');
}
export const loadJsonResource = jsonProjectFilePath => {
    const fileContent = readSync(jsonProjectFilePath);
    return JSON.parse(fileContent);
}

// please use it through MemoryCache
export const getPackageJsonContent = () => loadJsonResource('./package.json');

export const clone = obj => JSON.parse(JSON.stringify(obj));

export function getEnv(varName, defaultValue = null) {
    return process.env[varName] || defaultValue;
}

export function getEnvInt(varName, defaultValue = null) {
    return process.env[varName] | 0 || defaultValue; // | 0 convert to int
}

export const isSet = value => value !== undefined && value !== null && value !== "";

export const arrayIsNotEmpty = arr => isSet(arr) && arr.length > 0;

export const assumePropertyIsSet = (expectedValue, name) => {
    if (!isSet(expectedValue)) {
        throw new Error(`application properties - expect following '${name}' value to be set`);
    }
    return expectedValue;
}

export const nowISO8601 = () => dayjs().toISOString(); // '2019-01-25T02:00:00.000Z'
// dayjs doc: https://day.js.org/docs/en/manipulate/subtract
export const nowMinusHoursISO = (nbHours = 1) => dayjs().subtract(nbHours, 'hour').toISOString()
export const nowHuman = () => dayjs().format(BES_DATE_FORMAT);
/*
  getParisNowDate() {
    return new Date().toLocaleString('fr-FR', {
       timeZone: 'Europe/Paris'
    });
 */

export const generateErrorId = () => "ERR_" + dayjs().format("YYYYMMDDHHmmss");