import {clone, loadJsonResource} from "../lib/Common.js";
import {firstImageOf} from "../domain/post.js";
import {isSet} from "../lib/Common.js";
import {GR_BIRD_MINIMAL_PERCENT, IDENTIFY_RESULT} from "../servicesExternal/GrBirdApiService.js";

export default class BioClip {
    constructor(config, loggerService, pluginsCommonService, grBirdApiService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'BioClip'});
        this.pluginsCommonService = pluginsCommonService;
        this.grBirdApiService = grBirdApiService;
        try {
            this.questions = loadJsonResource('src/data/questionsBioClip.json');
            this.logger.info(`available with ${this.questions.length} questions`);
            this.isAvailable = true;
        } catch (exception) {
            this.logger.error(`init : ${exception.message}`);
        }
    }

    getName() {
        return "BioClip";
    }

    getPluginTags() {
        return ["#BeSBioClip", "#TreeOfLife10MPrediction"].join(' ');
    }

    getQuestions() {
        return clone(this.questions);
    }

    isReady() {
        return this.isAvailable;
    }

    async process(config) {
        const pluginName = this.getName();
        const {logger, pluginsCommonService, grBirdApiService, questions} = this;
        let {doSimulate = true, context} = config;
        let candidate = null;
        try {
            const maxHoursOld = 48;
            candidate = await pluginsCommonService.searchNextCandidate({...config, questions, maxHoursOld});
            if (candidate === null) {
                return pluginsCommonService.resultNoCandidate(pluginName, context);
            }
            const candidatePhoto = firstImageOf(candidate);
            if (!candidatePhoto) {
                return pluginsCommonService.rejectNoCandidateImage(pluginName, candidate, context);
            }
            pluginsCommonService.logCandidate(pluginName, candidate, candidatePhoto, context);

            const tags = this.getPluginTags();
            const imageUrl = candidatePhoto?.fullsize;
            const {
                result,
                bioResult = null
            } = await grBirdApiService.birdIdentify({
                imageUrl,
                tags,
                context
            });
            const imageAlt = bioResult;
            logger.info(`result:${result} ${isSet(bioResult) ? JSON.stringify(bioResult) : ""}`);
            logger.info(`bioResult:${JSON.stringify(bioResult)}`);
            if (result === IDENTIFY_RESULT.OK) {
                const {scoredResult} = bioResult;
                return await this.replyToWithIdentificationResult(candidate,
                    {tags, doSimulate, context, imageUrl, imageAlt},
                    {scoredResult}
                );
            } else {
                if (result !== IDENTIFY_RESULT.BAD_SCORE) {
                    logger.warn(`unable to handle grBirdApiService.birdIdentify result:${result} so consider it as NONE`);
                }
                return await pluginsCommonService.handleWithoutScoredResult(pluginName, GR_BIRD_MINIMAL_PERCENT,
                    {doSimulate, candidate, "replyTo": null, "muteAuthor": true, context}
                );
            }
        } catch (err) {
            // console.log(err.stack);// print stack
            // console.trace();// print stack
            return pluginsCommonService.rejectWithIdentifyError(pluginName, candidate, err, context);
        }
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
