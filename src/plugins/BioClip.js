import {clone, isSet, loadJsonResource} from "../lib/Common.js";
import {firstImageOf} from "../domain/post.js";
import {GR_BIRD_MINIMAL_PERCENT, IDENTIFY_RESULT} from "../servicesExternal/GrBirdApiService.js";

export default class BioClip {
    constructor(config, loggerService, pluginsCommonService, bioclipCommonService, grBirdApiService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'BioClip'});
        this.pluginsCommonService = pluginsCommonService;
        this.bioclipCommonService = bioclipCommonService;
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
        const {logger, pluginsCommonService, bioclipCommonService, grBirdApiService, questions} = this;
        let {doSimulate = true, context} = config;
        let candidate = null;
        let step = "searchNextCandidate";
        try {
            const maxHoursOld = 48;
            const hasImages = true;
            candidate = await pluginsCommonService.searchNextCandidate({...config, questions, hasImages, maxHoursOld});
            if (candidate === null) {
                return pluginsCommonService.resultNoCandidate(pluginName, context);
            }
            step = "firstImageOf";
            const candidatePhoto = firstImageOf(candidate);
            if (!candidatePhoto) {
                return pluginsCommonService.rejectNoCandidateImage(pluginName, candidate, context);
            }
            pluginsCommonService.logCandidate(pluginName, candidate, candidatePhoto, context);

            step = "birdIdentify";
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

            step = "birdIdentify handle response";
            logger.info(`result:${result} ${isSet(bioResult) ? JSON.stringify(bioResult) : ""}`);
            if (result === IDENTIFY_RESULT.OK) {
                const {scoredResult} = bioResult;
                const imageAlt = scoredResult;
                let options = {tags, doSimulate, context, imageUrl, imageAlt};
                return await bioclipCommonService.replyToWithIdentificationResult(candidate, options, {scoredResult});
            } else {
                if (result !== IDENTIFY_RESULT.BAD_SCORE) {
                    logger.warn(`unable to handle grBirdApiService.birdIdentify result:${result} so consider it as NONE`);
                }
                return await pluginsCommonService.handleWithoutScoredResult(pluginName, GR_BIRD_MINIMAL_PERCENT,
                    {doSimulate, candidate, "replyTo": null, "muteAuthor": true, context}
                );
            }
        } catch (err) {
            console.log(err);// print err
            console.log(err?.stack);// print stack
            console.trace();// print stack
            return pluginsCommonService.rejectWithIdentifyError(pluginName, step, candidate, err, context);
        }
    }


}
