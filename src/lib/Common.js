import path from 'node:path';
import fs from 'node:fs';
import process from "node:process";
import dayjs from "dayjs";

import utc from "dayjs/plugin/utc.js"
import timezone from "dayjs/plugin/timezone.js"

dayjs.extend(utc)
dayjs.extend(timezone)

export const BOT_NAME = 'botEnSky'
export const BOT_HANDLE = 'botensky.bsky.social'
export const DEFAULT_TZ = 'Europe/Paris'
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

export const assumePropertyIsSet = (expectedValue, name) => {
    if (!isSet(expectedValue)) {
        throw new Error(`application properties - expect following '${name}' value to be set`);
    }
    return expectedValue;
}

export const nowISO8601 = () => dayjs().toISOString(); // '2019-01-25T02:00:00.000Z'
// dayjs doc: https://day.js.org/docs/en/manipulate/subtract
export const nowMinusHoursUTCISO = (nbHours = 1) => dayjs.utc().subtract(nbHours, 'hour').toISOString()
export const nowHuman = (tz = DEFAULT_TZ) => dayjs().tz(tz).format(BES_DATE_FORMAT);
export const toHuman = (utcDateTimeString, tz= DEFAULT_TZ) => {
    return dayjs.utc(utcDateTimeString).tz(tz).format(BES_DATE_FORMAT);
};
export const toHumanFromSecond = (timestampInSeconds, tz = DEFAULT_TZ) => {
    return dayjs.unix(timestampInSeconds).tz(tz).format(BES_DATE_FORMAT);
};
export const toHumanDay = (utcDateTimeString, tz= DEFAULT_TZ) => {
    return dayjs.utc(utcDateTimeString).tz(tz).format("YYYY-MM-DD");
};
export const toHumanTime = (utcDateTimeString, tz= DEFAULT_TZ) => {
    return dayjs.utc(utcDateTimeString).tz(tz).format("HH:mm:ss");
};
export const getUtcTimestampWithDelta = (deltaDays) => {
    return dayjs.utc().add(deltaDays, 'day').unix();
};
/*
  getParisNowDate() {
    return new Date().toLocaleString('fr-FR', {
       timeZone: 'Europe/Paris'
    });
 */

export const generateErrorId = () => "ERR_" + dayjs().format("YYYYMMDDHHmmss");

// URL shortener - delegated to dedicated module
export { buildShortUrlWithText } from './UrlShortener.js';
export const maxStringLength = (variable, max) => {
    if (variable && variable.length > max) {
        return variable.substring(0, max - 3) + "...";
    }
    return variable;
}
export const timeout = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
}