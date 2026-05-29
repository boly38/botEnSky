import {isSet} from "../lib/Common.js";

export default class BioclipCommonService {
    constructor(loggerService, blueskyService, pluginsCommonService) {
        this.logger = loggerService.getLogger().child({label: 'BioclipCommonService'});
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
     * Format reply message with tags based on post language
     * @param {string} lang - Language code
     * @param {string} scoredResult - Identification result
     * @param {string} tags - Plugin tags
     * @returns {string} Formatted reply message
     */
    formatReplyMessage(lang, scoredResult, tags) {
        return `${scoredResult}\n\n${tags}`;
    }

    async replyToWithIdentificationResult(replyTo, options, bioResult) {
        const {pluginsCommonService} = this;
        const {tags, doSimulate, context, imageUrl, imageAlt} = options;
        const {scoredResult} = bioResult

        const postLanguage = this.getPostLanguage(replyTo);
        let replyMessage = this.formatReplyMessage(postLanguage, scoredResult, tags);

        // score result without image
        return await pluginsCommonService.replyResult(replyTo, {doSimulate, context, imageUrl, imageAlt}, replyMessage);
    }

}
