export default class BioclipCommonService {
    constructor(loggerService, blueskyService, pluginsCommonService) {
        this.logger = loggerService.getLogger().child({label: 'BioclipCommonService'});
        this.blueskyService = blueskyService;
        this.pluginsCommonService = pluginsCommonService;
    }

    async replyToWithIdentificationResult(replyTo, options, bioResult) {
        const {pluginsCommonService} = this;
        const {tags, doSimulate, context, imageUrl, imageAlt} = options;
        const {scoredResult} = bioResult

        let replyMessage = `${scoredResult}\n\n${tags}`;
        // score result without image
        return await pluginsCommonService.replyResult(replyTo, {doSimulate, context, imageUrl, imageAlt}, replyMessage);
    }

}
