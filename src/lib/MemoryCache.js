import {getEnv, getPackageJsonContent} from "./Common.js";
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
const getPackageJson = () => {
    if (MemoryCache.packageJson === null) {// cache miss
        DEBUG && console.log("cache miss:packageJson")
        MemoryCache.packageJson = getPackageJsonContent();
    }
    return MemoryCache.packageJson;
}

