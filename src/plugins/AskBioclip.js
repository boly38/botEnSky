import {clone, isSet, loadJsonResource} from "../lib/Common.js";
import {firstImageOf, postImageOf, postInfoOf, postLinkOf, postTextOf} from "../domain/post.js";
import {GR_BIRD_MINIMAL_PERCENT, IDENTIFY_RESULT} from "../servicesExternal/GrBirdApiService.js";

export default class AskBioclip {
    constructor(config, loggerService, blueskyService, pluginsCommonService, bioclipCommonService, grBirdApiService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'AskBioclip'});
        this.blueskyService = blueskyService;
        this.pluginsCommonService = pluginsCommonService;
        this.bioclipCommonService = bioclipCommonService;
        this.grBirdApiService = grBirdApiService;
        try {
            this.asks = loadJsonResource('src/data/askBioclip.json');
            this.isAvailable = true
            this.logger.info("available with " + this.asks.length + " asks");
        } catch (exception) {
            pluginsCommonService.logError("init", exception);
        }
    }

    getName() {
        return "AskBioclip";
    }

    getPluginTags() {
        return ["#BeSAskBioclip", "#TreeOfLife10MPrediction"].join(' ');
    }

    getQuestions() {
        return clone(this.asks);
    }

    isReady() {
        return this.isAvailable;
    }

    async process(config) {
        const pluginName = this.getName();
        let {doSimulate, context} = config;
        const {
            grBirdApiService, pluginsCommonService, bioclipCommonService, blueskyService, logger,
            "asks": questions
        } = this;
        let candidate = null;
        let step = "searchNextCandidate";
        try {
            const maxHoursOld = 72;
            // keep hasImages=false as this is mention post's parent which include flower image
            const candidate = await pluginsCommonService.searchNextCandidate({...config, questions, maxHoursOld});
            if (candidate === null) {
                return pluginsCommonService.resultNoCandidate(pluginName, context);
            }
            step = "getParentPostOf";
            const parentPost = await blueskyService.getParentPostOf(candidate.uri);
            if (parentPost === null) {
                return await pluginsCommonService.resultNoCandidateParent(candidate, pluginName, context);
            }
            logger.debug(`CANDIDATE's PARENT:${parentPost ? postTextOf(parentPost) : "NONE"}`);
            step = "firstImageOf";
            const parentPhoto = firstImageOf(parentPost);
            if (!parentPhoto) {
                return await pluginsCommonService.rejectNoCandidateParentImage(candidate, parentPost, pluginName, context);
            }
            logger.debug(`post Candidate Parent : ${postLinkOf(parentPost)}\n` +
                `\t${postInfoOf(parentPost)}\n` +
                `\t${postImageOf(parentPhoto)}`, context);

            step = "birdIdentify";
            const tags = this.getPluginTags();
            const imageUrl = parentPhoto?.fullsize;
            const {
                result,
                bioResult = null
            } = await grBirdApiService.birdIdentify({
                imageUrl,
                tags,
                context
            });

            step = "birdIdentify handle response";
            logger.info(`result:${result} ${isSet(bioResult) ? JSON.stringify(bioResult) : ""}`);
            logger.info(`bioResult:${JSON.stringify(bioResult)}`);
            if (result === IDENTIFY_RESULT.OK) {
                const {scoredResult} = bioResult;
                const imageAlt = scoredResult;
                return await bioclipCommonService.replyToWithIdentificationResult(candidate,
                    {tags, doSimulate, context, imageUrl, imageAlt},
                    {scoredResult}
                );
            } else if (result === IDENTIFY_RESULT.BAD_SCORE) {
                return await pluginsCommonService.handleWithoutScoredResult(pluginName, GR_BIRD_MINIMAL_PERCENT,
                    {doSimulate, "candidate": parentPost, "replyTo": candidate, "muteAuthor": false, context}
                );
            } else {
                if (result !== IDENTIFY_RESULT.BAD_SCORE) {
                    logger.warn(`unable to handle grBirdApiService.birdIdentify result:${result} so consider it as NONE`);
                }
                return await pluginsCommonService.handleWithNoIdentificationResult(pluginName,
                    {doSimulate, "candidate": parentPost, "replyTo": candidate, "muteAuthor": false, context}
                );
            }
        } catch (err) {
            return pluginsCommonService.rejectWithParentIdentifyError(step, candidate, pluginName, err, context);
        }
    }

}
