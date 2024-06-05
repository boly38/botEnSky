import {arrayIsNotEmpty, clone, isSet, loadJsonResource} from "../lib/Common.js";
import {firstImageOf} from "../domain/post.js";
import {IDENTIFY_RESULT} from "../services/PlantnetApiService.js";

export default class Plantnet {
    constructor(config, loggerService, blueskyService, plantnetCommonService, plantnetApiService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'Pl@ntNet'});
        this.blueskyService = blueskyService;
        this.plantnetSimulate = (config.bot.plantnetSimulate === true);
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
        const {plantnetSimulate, plantnetCommonService, plantnetApiService, logger} = this;
        let {doSimulate, simulateIdentifyCase, context} = config;
        const doSimulateIdentify = plantnetSimulate || isSet(simulateIdentifyCase);// if at least one want to simulate then simulate
        let candidate = null;
        try {
            candidate = await this.searchNextCandidate(config);
            if (candidate === null) {
                return plantnetCommonService.resultNoCandidate(pluginName, context);
            }
            const candidatePhoto = firstImageOf(candidate);
            if (!candidatePhoto) {
                return plantnetCommonService.rejectNoCandidateImage(pluginName, candidate, context);
            }
            plantnetCommonService.logCandidate(pluginName, candidate, candidatePhoto, context);

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
                return await plantnetCommonService.handleWithoutScoredResult(
                    {doSimulate, candidate, "replyTo": null, "muteAuthor": true, context}
                );
            } else {
                if (result !== IDENTIFY_RESULT.NONE) {
                    logger.warn(`unable to handle plantnetService.plantnetIdentify result:${result} so consider it as NONE`);
                }
                return await plantnetCommonService.handleWithNoIdentificationResult(
                    {doSimulate, candidate, "replyTo": null, "muteAuthor": true, context}
                );
            }
        } catch (err) {
            return plantnetCommonService.rejectWithIdentifyError(pluginName, candidate, err, context);
        }
    }

    /**
     * iterate through plugin.questions to search next candidate
     *
     * Bluesky advanced search may improve this stage :
     * https://github.com/bluesky-social/social-app/issues/3378 (parent of advanced search)
     * https://github.com/bluesky-social/social-app/issues/1522 (Use Boolean search operators AND and OR)
     * https://github.com/bluesky-social/social-app/issues/4093 (ability to know supported keyword/search logic/tips)
     * https://github.com/bluesky-social/social-app/issues/4094 (support has:images to filter only post having image)
     *
     * @param config
     * @param bookmark
     * @returns {Promise<unknown>}
     */
    async searchNextCandidate(config, bookmark = 0) {
        const {questions, blueskyService, logger} = this;
        const {context, doSimulateSearch} = config;
        if (doSimulateSearch) {
            await blueskyService.login();
            return Promise.resolve(loadJsonResource("src/data/blueskyPostFakeFlower.json"));
        }
        const candidatePosts = await blueskyService.searchPosts({
            searchQuery: questions[bookmark],
            "hasImages": true,
            "hasNoReply": true,
            "isNotMuted": true,
            "maxHoursOld": 24// now-24h ... now
        })
        logger.info(`${candidatePosts.length} candidate(s)`, context);
        if (arrayIsNotEmpty(candidatePosts)) {
            return Promise.resolve(candidatePosts[0]);
        }
        if (bookmark + 1 < questions.length) {
            return await this.searchNextCandidate(config, bookmark + 1)
        }
        return Promise.resolve(null);
    }

}
