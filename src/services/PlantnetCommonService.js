import {buildShortUrlWithText, isSet} from "../lib/Common.js";

export default class PlantnetCommonService {
    constructor(loggerService, blueskyService, pluginsCommonService) {
        this.logger = loggerService.getLogger().child({label: 'PlantnetCommonService'});
        this.blueskyService = blueskyService;
        this.pluginsCommonService = pluginsCommonService;
    }

    async replyToWithIdentificationResult(replyTo, options, pnResult) {
        const {logger, pluginsCommonService} = this;
        const {tags, doSimulate, context} = options;
        const {scoredResult, firstImageOriginalUrl, firstImageText} = pnResult

        let replyMessage = `${scoredResult}\n\n${tags}`;
        if (isSet(firstImageOriginalUrl)) {// score result with image
            const firstImageAltText = `${firstImageText} comme image exemple pour le résultat suivant: ${scoredResult}`;
            const imageUrl = firstImageOriginalUrl;
            const imageAlt = firstImageAltText;
            let embed;
            try {
                embed = await this.blueskyService.prepareImageUrlAsBlueskyEmbed(firstImageOriginalUrl, firstImageAltText)
            } catch (embedErr) {
                // image as text link into reply post
                logger.info(`Unable to make bluesky embed of image ${firstImageOriginalUrl}, so keep it as text link: ${embedErr.message}`);
                const illustrateImage = await buildShortUrlWithText(this.logger, firstImageOriginalUrl,
                    firstImageText + "\n")
                const withImageLink = (illustrateImage ? "\n\n" + illustrateImage : "")
                replyMessage = `${scoredResult}\n${withImageLink} \n\n${tags}`;
                return await pluginsCommonService.replyResult(replyTo, {doSimulate, context, imageUrl, imageAlt}, replyMessage);
            }
            // image embedded into reply post
            return await pluginsCommonService.replyResult(replyTo, {doSimulate, context, imageUrl, imageAlt}, replyMessage, embed);
        }
        // score result without image
        return await pluginsCommonService.replyResult(replyTo, {doSimulate, context}, replyMessage);
    }

}
