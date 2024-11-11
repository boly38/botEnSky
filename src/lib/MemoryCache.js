import {getEnv, getPackageJsonContent, isSet} from "./Common.js";
import console from "node:console";

const DEBUG = getEnv("CACHE_DEBUG", false) === "true";
//~ public
export const cacheGetVersion = () => {
    return getPackageJson()?.version;
}
export const cacheGetProjectMetadata = key => {
    return getPackageJson()?.metadata[key];
}
export const cacheGetProjectHomepage = () => {
    return getPackageJson()?.homepage;
}
export const cacheGetProjectBugsUrl = () => {
    return getPackageJson()?.bugs?.url;
}

//~ private
class MemoryCache {
    /**
     * handle app instance in-memory objects
     */
}

MemoryCache.packageJson = null;
MemoryCache.ttlObject = [/* { key, ttl, value }, { key, ttl, value } ... */];

//~ packageJson
const getPackageJson = () => {
    if (MemoryCache.packageJson === null) {// cache miss
        DEBUG && console.log("cache miss:packageJson")
        MemoryCache.packageJson = getPackageJsonContent();
    }
    return MemoryCache.packageJson;
}

//~ ttlObject
const nowEpochSec = () => {
    const now = new Date()
    const utcMsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
    return Math.round(utcMsSinceEpoch / 1000)
}
const evictDeprecatedTtlObject = () => {
    MemoryCache.ttlObject = MemoryCache.ttlObject.filter(ttlObject => ttlObject.ttl > nowEpochSec());
}
export const cacheEvictKey = key => {
    DEBUG && console.log(`cache::cacheEvictKey ${key}`);
    MemoryCache.ttlObject = MemoryCache.ttlObject.filter(ttlObject => ttlObject.key !== key);
}
export const cacheGetTtlObject = (key, ttlSecond, objectProviderFunction) => {
    return new Promise((resolve, reject) => {
        evictDeprecatedTtlObject();
        const ttlObjects = MemoryCache.ttlObject.filter(ttlObject => ttlObject.key === key)
        if (isSet(ttlObjects) && ttlObjects.length === 1) {
            DEBUG && console.log(`cache solve ${key}:${JSON.stringify(ttlObjects[0].value)}`);
            return resolve(ttlObjects[0].value);
        }
        cacheEvictKey(key);
        DEBUG && console.log(`cache miss:getTtlObject ${key}`);
        const ttl = nowEpochSec() + ttlSecond;
        objectProviderFunction()
            .then(value => {
                MemoryCache.ttlObject.push({key, ttl, value})
                resolve(value);
            })
            .catch(reject);
    });
}