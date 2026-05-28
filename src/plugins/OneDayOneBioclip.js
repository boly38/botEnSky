import {pluginResolve} from "../services/BotService.js";
import {BOT_HANDLE, buildShortUrlWithText, isSet, loadJsonResource} from "../lib/Common.js";
import {limitString} from "../lib/StringUtil.js";
import console from "node:console";
import {IDENTIFY_RESULT} from "../servicesExternal/GrBirdApiService.js";
import {postBodyOf, postHtmlOf, postTextOf} from "../domain/post.js";
import {idOfPhoto, shortDescriptionOfPhoto, urlOfPhoto, usernameOfPhoto} from "../services/UnsplashService.js";

export default class OneDayOneBioclip {
    constructor(config, loggerService, blueskyService, unsplashService, pluginsCommonService, grBirdApiService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'OneDayOneBioclip'});
        this.blueskyService = blueskyService;
        this.unsplashService = unsplashService;
        this.pluginsCommonService = pluginsCommonService;
        this.grBirdApiService = grBirdApiService;
        try {
            this.queries = loadJsonResource('src/data/oneDayOneBioclip.json');
            this.isAvailable = unsplashService.isReady();
            this.logger.info((this.isAvailable ? "available" : "not available") + " with " + this.queries.length + " queries");
        } catch (exception) {
            this.pluginsCommonService.logError("init", exception);
        }
    }

    getName() {
        return "OneDayOneBioclip";
    }

    getPluginTags() {
        return ["#1Day1Bioclip"].join(' ');
    }

    isReady() {
        return this.isAvailable;
    }

    async process(config) {
        const pluginName = this.getName();
        const {doSimulate, context} = config;
        const {logger, pluginsCommonService, blueskyService, unsplashService, grBirdApiService} = this;

        //~ search bio photos from unsplash service
        let step = "search photos";
        try {
            //~ retrieve list of recent unsplash authors used for 1Day1Bioclip
            const excludedAuthors = await this.getRecentUnsplashAuthors(blueskyService, logger);

            //~ search next photos candidates
            let photos = await unsplashService.searchNextPhotos({excludedAuthors});

            //~ identify photos until good score
            step = "birdIdentify";
            const tags = this.getPluginTags();
            let photo;
            while (photos?.length > 0) {
                photo = photos[0];
                const imageUrl = urlOfPhoto(photo);
                const {
                    result,
                    bioResult = null
                } = await grBirdApiService.birdIdentify({
                    imageUrl,
                    tags,
                    context,
                    post: null // Unsplash photo, not a Bluesky post
                });
                if (result === IDENTIFY_RESULT.OK) {
                    const {scoredResult} = bioResult;
                    const imageAlt = scoredResult;
                    let extendedDetails = await unsplashService.getPhotoExtendedDetails(idOfPhoto(photo));
                    logger.info(`result:${result} ${isSet(bioResult) ? JSON.stringify(bioResult) : ""}`);
                    return await this.postOneDay({
                        photo, tags, doSimulate, context, imageUrl, imageAlt, extendedDetails
                    });
                } else {
                    logger.info(`!OK result:${result} for ${imageUrl}`);
                }
                photos.shift();// remove first element cause identification was not OK
            }
            return await pluginsCommonService.resultNoCandidate(pluginName, context);
        } catch (err) {
            console.trace();// print stack // TODO comment this in the futur
            return pluginsCommonService.rejectWithParentIdentifyError(step, null, pluginName, err, context);
        }
    }

    async getRecentUnsplashAuthors(blueskyService, logger) {
        const posts = await blueskyService.searchPosts({
            author: BOT_HANDLE,
            searchQuery: "from:me #1Day1Bioclip",
            "hasImages": false,
            "hasNoReply": false,
            "isNotMuted": false,
            "maxHoursOld": 31 * 24,// now-31d ... now
            "limit": 100,
            "exclusions": []
        });
        const regex = /by\s*(.*?)\s*\(Unsplash/;// extract from previous posts unsplash author name
        const matchEntriesTexts = posts.map(post => {
            const match = postBodyOf(post).match(regex);
            return match ? match[1] : null; // get extracted text or null if no match
        }).filter(text => text !== null); // remove null
        logger.info(`extracted recent #1Day1Bioclip authors :${JSON.stringify(matchEntriesTexts)}`);
        return Promise.resolve(matchEntriesTexts)
    }

    async postOneDay(options) {
         const {logger, pluginsCommonService, blueskyService} = this;
         const {photo, tags, doSimulate, context, imageUrl, imageAlt, extendedDetails} = options;
         const photo_description = shortDescriptionOfPhoto(photo);
         const unsplashUrl = await buildShortUrlWithText(this.logger, photo.origin, "Unsplash ")
         let newPostContent = `
${photo_description} by ${usernameOfPhoto(photo)} (${unsplashUrl})\n
${imageAlt}\n
${tags}`.trim();

         // Bluesky has a 300 character limit - optimize content if needed
         const MAX_POST_LENGTH = 300;
         if (newPostContent.length > MAX_POST_LENGTH) {
             logger.warn(`Original post length (${newPostContent.length}) exceeds limit (${MAX_POST_LENGTH}), optimizing...`);
             try {
                 newPostContent = this.optimizePostContent(newPostContent, imageAlt, photo_description, usernameOfPhoto(photo), unsplashUrl, tags, logger, MAX_POST_LENGTH);
                 logger.info(`Optimized post length: ${newPostContent.length}`);
             } catch (err) {
                 logger.info(`Post content too long to optimize: ${newPostContent.length} chars`);
                 throw err;
             }
         }

         // 4- produce post : text, html
         return new Promise((resolve, reject) => {
             blueskyService.newPost(newPostContent, doSimulate, imageUrl, imageAlt + extendedDetails)
                 .then(newPost => {
                     const htmlOf = postHtmlOf(newPost);
                     const textOf = postTextOf(newPost);
                     const imageHtml = pluginsCommonService.imageHtmlOf(imageUrl, imageAlt);
                     const postSent = doSimulate ? "SIMULATION - Réponse prévue" : "Réponse émise";
                       resolve(pluginResolve(
       `Post:\n\t${textOf}\n\t${postSent} : ${textOf}`,
       `${imageHtml}<div class="bg-info">${htmlOf}</div><b>${postSent}</b>`,
       200,
       doSimulate ? 0 : 1
                     ));
                 })
                 .catch(err => {
                     logger.warn(err);// print err
                     logger.info(err?.stack);// print stack
                     console.trace();// print stack
                     pluginsCommonService.logError("post", err, {
                         ...context,
                         doSimulate,
                         message: newPostContent,
                         imageUrl,
                         imageAlt
                     });
                     reject(new Error("impossible de répondre au post"));
                 });
         });
     }

     /**
      * Optimize post content to respect Bluesky 300 character limit
      * Priority: preserve Unsplash URL (credit), BioClip alt text (identification), and #1Day1Bioclip tag
      *
      * Strategy:
      * 1. Try original full content
      * 2. Try limiting photo description only
      * 3. Try removing Unsplash URL (keep alt + tag)
      * 4. Reject with exception if still too long
      *
      * @private
      * @throws Error if content cannot be optimized to fit limit
      */
     optimizePostContent(fullContent, imageAlt, photoDesc, username, unsplashUrl, tags, logger, maxLength) {
         // Strategy 1: Try original
         if (fullContent.length <= maxLength) {
             return fullContent;
         }

         // Strategy 2: Limit photo description (preserve URL + alt + tags)
         let shortened_desc = limitString(photoDesc, 30);
         let optimized = `
${shortened_desc} by ${username} (${unsplashUrl})\n
${imageAlt}\n
${tags}`.trim();

         if (optimized.length <= maxLength) {
             logger.info(`Strategy 2: Limited photo description (${optimized.length} chars)`);
             return optimized;
         }

         // Strategy 3: Remove Unsplash URL to save space (preserve alt + tag - they're essential)
         optimized = `
${shortened_desc} by ${username}\n
${imageAlt}\n
${tags}`.trim();

         if (optimized.length <= maxLength) {
             logger.info(`Strategy 3: Removed Unsplash URL (${optimized.length} chars)`);
             return optimized;
         }

         // Strategy 4: Cannot optimize - reject
         logger.info(`Cannot optimize post to ${maxLength} chars. Original length: ${fullContent.length}`);
         logger.info(`Full content:\n${fullContent}`);
         throw new Error(`Post content too long (${fullContent.length} chars) and cannot be optimized to fit Bluesky 300 character limit while preserving essential information`);
     }
}

