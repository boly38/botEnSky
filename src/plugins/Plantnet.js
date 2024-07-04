import {clone, isSet, loadJsonResource} from "../lib/Common.js";
import {firstImageOf} from "../domain/post.js";
import {IDENTIFY_RESULT, PLANTNET_MINIMAL_PERCENT} from "../servicesExternal/PlantnetApiService.js";

export default class Plantnet {
    constructor(config, loggerService, blueskyService, pluginsCommonService, plantnetCommonService, plantnetApiService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'Pl@ntNet'});
        this.blueskyService = blueskyService;
        this.plantnetSimulate = (config.bot.plantnetSimulate === true);
        this.pluginsCommonService = pluginsCommonService;
        this.plantnetCommonService = plantnetCommonService;
        this.plantnetApiService = plantnetApiService;
        try {
            this.questions = loadJsonResource('src/data/questionsPlantnet.json');
            this.isAvailable = plantnetApiService.isReady();
            this.logger.info((this.isAvailable ? "available" : "not available") +
                " with " + this.questions.length + " questions");
        } catch (exception) {
            plantnetCommonService.logError("init", exception);
        }
    }

    getName() {
        return "Plantnet";
    }

    getPluginTags() {
        return ["#BeSPlantnet", "#IndentificationDePlantes"].join(' ');
    }

    getQuestions() {
        return clone(this.questions);
    }

    isReady() {
        return this.isAvailable;
    }

    async process(config) {
        const pluginName = this.getName();
        const {
            plantnetSimulate,
            pluginsCommonService,
            plantnetCommonService,
            plantnetApiService,
            logger,
            questions
        } = this;
        let {doSimulate, simulateIdentifyCase, context} = config;
        const doSimulateIdentify = plantnetSimulate || isSet(simulateIdentifyCase);// if at least one want to simulate then simulate
        let candidate = null;
        try {
            candidate = await pluginsCommonService.searchNextCandidate({...config, questions});
            if (candidate === null) {
                return pluginsCommonService.resultNoCandidate(pluginName, context);
            }
            const candidatePhoto = firstImageOf(candidate);
            if (!candidatePhoto) {
                return pluginsCommonService.rejectNoCandidateImage(pluginName, candidate, context);
            }
            pluginsCommonService.logCandidate(pluginName, candidate, candidatePhoto, context);

            const tags = this.getPluginTags();
            const {
                result,
                plantnetResult = null
            } = await plantnetApiService.plantnetIdentify({
                "imageUrl": candidatePhoto?.fullsize,
                doSimulate,
                doSimulateIdentify,
                simulateIdentifyCase,
                candidate,
                tags,
                context
            });
            if (result === IDENTIFY_RESULT.OK) {
                const {scoredResult, firstImageOriginalUrl, firstImageText} = plantnetResult;
                return await plantnetCommonService.replyToWithIdentificationResult(candidate,
                    {tags, doSimulate, context},
                    {scoredResult, firstImageOriginalUrl, firstImageText}
                );
            } else if (result === IDENTIFY_RESULT.BAD_SCORE) {
                return await pluginsCommonService.handleWithoutScoredResult(pluginName, PLANTNET_MINIMAL_PERCENT,
                    {doSimulate, candidate, "replyTo": null, "muteAuthor": true, context}
                );
            } else {
                if (result !== IDENTIFY_RESULT.NONE) {
                    logger.warn(`unable to handle plantnetService.plantnetIdentify result:${result} so consider it as NONE`);
                }
                return await pluginsCommonService.handleWithNoIdentificationResult(
                    {doSimulate, candidate, "replyTo": null, "muteAuthor": true, context}
                );
            }
        } catch (err) {
            return pluginsCommonService.rejectWithIdentifyError(pluginName, candidate, err, context);
        }
    }

}
