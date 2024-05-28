import path from 'node:path';
import fs from 'node:fs';
import process from "node:process";
import dayjs from "dayjs";

import utc from "dayjs/plugin/utc.js"
import timezone from "dayjs/plugin/timezone.js"
import axios from "axios"; // dependent on utc plugin

dayjs.extend(utc)
dayjs.extend(timezone)

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
export const nowMinusHoursUTCISO = (nbHours = 1) => dayjs.utc().subtract(nbHours, 'hour').toISOString()
export const nowHuman = tz => dayjs().tz(tz).format(BES_DATE_FORMAT);
export const toHuman = (utcDateTimeString, tz) => {
    return dayjs.utc(utcDateTimeString).tz(tz).format(BES_DATE_FORMAT);
};
/*
  getParisNowDate() {
    return new Date().toLocaleString('fr-FR', {
       timeZone: 'Europe/Paris'
    });
 */

export const generateErrorId = () => "ERR_" + dayjs().format("YYYYMMDDHHmmss");

export const getEncodingBufferAndBase64FromUri = imageUri => {
    return new Promise((resolve, reject) => {
        axios
            .get(imageUri, {
                responseType: 'arraybuffer'
            })
            .then(response => {
                const encoding = response.headers["content-type"];
                const buffer = Buffer.from(response.data, 'binary');/* incoming data are binary */
                const base64 = buffer.toString('base64');
                resolve({encoding, buffer, base64});
            })
            .catch(reject)
    });
};