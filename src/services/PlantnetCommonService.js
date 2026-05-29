import {buildShortUrlWithText, isSet} from "../lib/Common.js";

export default class PlantnetCommonService {
    constructor(loggerService, blueskyService, pluginsCommonService) {
        this.logger = loggerService.getLogger().child({label: 'PlantnetCommonService'});
        this.blueskyService = blueskyService;
        this.pluginsCommonService = pluginsCommonService;
    }

    /**
     * Get the primary language of a post
     * Defaults to 'fr' if not available
     * @param {object} post - The post object containing record.langs
     * @returns {string} Language code ('en', 'fr', etc.)
     */
    getPostLanguage(post) {
        const langs = post?.record?.langs;
        if (isSet(langs) && langs.length > 0) {
            return langs[0]; // Take first language
        }
        return 'fr'; // Default to French
    }

    /**
     * Get localized image alt text based on post language
     * @param {string} lang - Language code
     * @param {string} firstImageText - Original image text
     * @param {string} scoredResult - Identification result
     * @returns {string} Localized alt text
     */
    getLocalizedImageAltText(lang, firstImageText, scoredResult) {
        if (lang === 'en') {
            return `${firstImageText} as example image for the following result: ${scoredResult}`;
        }
        // Default to French
        return `${firstImageText} comme image exemple pour le résultat suivant: ${scoredResult}`;
    }

    /**
     * Format reply message with tags based on post language
     * @param {string} lang - Language code
     * @param {string} scoredResult - Identification result
     * @param {string} tags - Plugin tags
     * @returns {string} Formatted reply message
     */
    formatReplyMessage(lang, scoredResult, tags) {
        return `${scoredResult}\n\n${tags}`;
    }

    async replyToWithIdentificationResult(replyTo, options, pnResult) {
        const {logger, pluginsCommonService} = this;
        const {tags, doSimulate, context} = options;
        const {scoredResult, firstImageOriginalUrl, firstImageText} = pnResult

        const postLanguage = this.getPostLanguage(replyTo);
        let replyMessage = this.formatReplyMessage(postLanguage, scoredResult, tags);

        if (isSet(firstImageOriginalUrl)) {// score result with image
            const firstImageAltText = this.getLocalizedImageAltText(postLanguage, firstImageText, scoredResult);
            const imageUrl = firstImageOriginalUrl;
            const imageAlt = firstImageAltText;
            let embed;
            try {
                embed = await this.blueskyService.prepareImageUrlAsBlueskyEmbed(firstImageOriginalUrl, firstImageAltText)
            } catch (embedErr) {
                // image as text link into reply post
                logger.info(`Unable to make bluesky embed of image ${firstImageOriginalUrl}, so keep it as text link: ${embedErr.message}`);
                const illustrateImage = await buildShortUrlWithText(this.logger, firstImageOriginalUrl,
                    firstImageText)
                const withImageLink = (illustrateImage ? "\n\n" + illustrateImage : "")
                replyMessage = `${scoredResult}\n${withImageLink}\n\n${tags}`;
                return await pluginsCommonService.replyResult(replyTo, {doSimulate, context, imageUrl, imageAlt}, replyMessage);
            }
            // image embedded into reply post
            return await pluginsCommonService.replyResult(replyTo, {doSimulate, context, imageUrl, imageAlt}, replyMessage, embed);
        }
        // score result without image
        return await pluginsCommonService.replyResult(replyTo, {doSimulate, context}, replyMessage);
    }

}
