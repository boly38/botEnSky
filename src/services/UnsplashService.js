import {buildUrl} from "../lib/UrlUtil.js";
import {arrayGetRandomElement} from "../lib/ArrayUtil.js";
import {isSet, loadJsonResource} from "../lib/Common.js";
import {limitString} from "../lib/StringUtil.js";

const MAX_COLLECTION_RETRIES = 5;

export const idOfPhoto = photo => photo?.id;
export const urlOfPhoto = photo => photo?.urls?.full;
export const usernameOfPhoto = photo => photo.user.name;
export const shortDescriptionOfPhoto = (photo, maxLength = 60) =>
    limitString(photo?.alt_description || 'No description', maxLength);

// possible improvement : Unsplash JS client : unsplash-js > https://github.com/unsplash/unsplash-js
export default class UnsplashService {
    constructor(config, loggerService, pluginsCommonService) {
        this.config = config;
        this.logger = loggerService.getLogger().child({label: 'UnsplashService'});
        this.pluginsCommonService = pluginsCommonService;
        this.api_base_url = "https://api.unsplash.com";
        this.access_key = this.config?.unsplash?.access_key;
        try {
            this.queries = loadJsonResource('src/data/oneDayOneBioclip.json');
            this.isEnabled = isSet(this.access_key);
            if (this.isEnabled) {
                this.logger.info("enabled with " + this.queries.length + " queries");
            } else {
                this.logger.error("UnsplashService not enabled, please setup your environment");
            }
        } catch (exception) {
            this.pluginsCommonService.logError("init", exception);
        }
    }

    isReady() {
        return this.isEnabled;
    }


    /**
     * Fetch collections from Unsplash based on a keyword
     * @param keyword
     * @returns {Promise<(function(*): string)|*|*[]>}
     */
    async searchCollections(keyword) {
        const {api_base_url, "access_key": client_id} = this;
        const url = buildUrl(`${api_base_url}/search/collections`, {
            query: keyword,
            per_page: 30,
            client_id,
        });

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Unsplash API HTTP Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results || [];
    }

    /**
     * Fetch photos from a specific collection
     * @param collectionId
     * @returns {Promise<any|*[]>}
     */
    async searchPhotosInCollection(collectionId) {
        const {api_base_url, "access_key": client_id} = this;
        const url = buildUrl(`${api_base_url}/collections/${collectionId}/photos`, {
            per_page: 30,
            client_id,
        });

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Unsplash API HTTP Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data || [];
    }

    /**
     * get photo by id
     * @param id
     * @returns {Promise<any|*[]>}
     */
    async getPhotoDetailsById(id) {
        const {api_base_url, "access_key": client_id} = this;
        const url = buildUrl(`${api_base_url}/photos/${id}`, {
            client_id
        });

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Unsplash API HTTP Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data || [];
    }

    async searchNextPhotos(config) {
        const {isEnabled, logger, queries} = this;
        logger.debug(`searchNextCandidate:${JSON.stringify(config)}`)
        if (!isEnabled) {
            logger.warn("⚠️  Unsplash DISABLED");
            return Promise.reject(new Error("Unsplash DISABLED"));
        }
        let {
            excludedAuthors = []
        } = config;

        // Choose a random query
        const query = arrayGetRandomElement(queries);

        // Search collections using the chosen query
        const collections = await this.searchCollections(query);
        if (collections.length === 0) {
            logger.info(`⚠️ No collections found for the query:${query}`);
            return Promise.resolve([]);
        }

        let photos = [];
        let retries = 0;
        // Choose a random collection and search photos
        while (photos.length === 0 && retries++ < MAX_COLLECTION_RETRIES) {
            const collection = arrayGetRandomElement(collections);
            photos = await this.searchPhotosInCollection(collection.id);
            const initialLength = photos.length;
            // Remove photos from recent already published authors
            photos = photos.filter(p => !excludedAuthors.includes(!p.user?.name))
            // add origin: collection link
            photos.forEach(p => p.origin = `https://unsplash.com/collections/${collection.id}`)
            if (photos.length === 0 && retries < MAX_COLLECTION_RETRIES) {
                logger.info(`https://unsplash.com/collections/${collection.id} (${initialLength} entries) no not already published, retry ${retries}`);
            }
        }

        if (photos.length === 0) {
            logger.info(`⚠️ No eligible photo found after ${retries} retries. Activity cancelled.`);
            return Promise.resolve([]);
        }
        return Promise.resolve(photos);
    }

    async getPhotoExtendedDetails(id) {
        const details = await this.getPhotoDetailsById(id);
        // DEBUG // console.log(`details:${JSON.stringify(details)}`)
        const exifName = details?.exif?.name;
        const locationName = details?.location?.name;
        const tags = details?.tags?.map(t => t.title);
        const updated_at = details?.updated_at;
        let extendedDetails = "";
        if (exifName) {
            extendedDetails += `exif:${exifName}\n`;
        }
        if (locationName) {
            extendedDetails += `location:${locationName}\n`;
        }
        if (tags?.length) {
            extendedDetails += `keywords: ${tags.join(', ')}\n`;
        }
        if (updated_at) {
            extendedDetails += `updated: ${new Date(updated_at)}\n`;
        }
        return extendedDetails === "" ? "" : `\nImage Unsplash details :\n${extendedDetails}`;
    }
}


