export default class BioclipCommonService {
    constructor(loggerService, blueskyService, pluginsCommonService) {
        this.logger = loggerService.getLogger().child({label: 'BioclipCommonService'});
        this.blueskyService = blueskyService;
        this.pluginsCommonService = pluginsCommonService;
    }

    async replyToWithIdentificationResult(replyTo, options, pnResult) {
        const {pluginsCommonService} = this;
        const {tags, doSimulate, context, imageUrl, imageAlt} = options;
        const {scoredResult} = pnResult

        let replyMessage = `${scoredResult}\n\n${tags}`;
        // score result without image
        return await pluginsCommonService.replyResult(replyTo, {doSimulate, context, imageUrl, imageAlt}, replyMessage);
    }

}
