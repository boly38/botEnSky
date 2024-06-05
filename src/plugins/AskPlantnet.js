import {arrayIsNotEmpty, clone, isSet, loadJsonResource} from "../lib/Common.js";
import {firstImageOf, postHtmlOf, postImageOf, postInfoOf, postLinkOf, postTextOf} from "../domain/post.js";
import {pluginReject, pluginResolve} from "../services/BotService.js";
import {IDENTIFY_RESULT} from "../services/PlantnetApiService.js";

export default class AskPlantnet {
    constructor(config, loggerService, blueskyService, plantnetCommonService, plantnetApiService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'AskPl@ntNet'});
        this.logger.level = "INFO"; // DEBUG will show search results
        this.blueskyService = blueskyService;
        this.plantnetSimulate = (config.bot.plantnetSimulate === true);
        this.plantnetCommonService = plantnetCommonService;
        this.plantnetApiService = plantnetApiService;
        try {
            this.asks = loadJsonResource('src/data/askPlantnet.json');
            this.isAvailable = plantnetApiService.isReady();
            this.logger.info((this.isAvailable ? "available" : "not available") +
                " with " + this.asks.length + " asks");
        } catch (exception) {
            plantnetCommonService.logError("init", exception);
        }
    }

    getName() {
        return "AskPlantnet";
    }

    getPluginTags() {
        return ["#BeSAskPlantnet", "#IndentificationDePlantes"].join(' ');
    }

    getQuestions() {
        return clone(this.asks);
    }

    isReady() {
        return this.isAvailable;
    }

    async process(config) {
        const pluginName = this.getName();
        let {doSimulate, simulateIdentifyCase, context} = config;
        const {plantnetSimulate, plantnetCommonService, plantnetApiService, blueskyService, logger} = this;
        const doSimulateIdentify = plantnetSimulate || isSet(simulateIdentifyCase);// if at least one want to simulate then simulate
        let candidate = null;
        try {
            const candidate = await this.searchNextAsk(config);
            if (candidate === null) {
                return plantnetCommonService.resultNoCandidate(pluginName, context);
            }
            const parentPost = await blueskyService.getParentPostOf(candidate.uri);
            if (parentPost === null) {
                return plantnetCommonService.resultNoCandidateParent(candidate, context);
            }
            logger.debug(`CANDIDATE's PARENT:${parentPost ? postTextOf(parentPost) : "NONE"}`);
            const parentPhoto = firstImageOf(parentPost);
            if (!parentPhoto) {
                return this.rejectNoCandidateParentImage(parentPost, context);
            }
            logger.debug(`post Candidate Parent : ${postLinkOf(parentPost)}\n` +
                `\t${postInfoOf(parentPost)}\n` +
                `\t${postImageOf(parentPhoto)}`, context);

            const tags = this.getPluginTags();
            const identifyOptions = {
                "imageUrl": parentPhoto?.fullsize,
                doSimulate,
                doSimulateIdentify,
                simulateIdentifyCase,
                candidate,
                tags,
                context
            };
            const {
                result,
                plantnetResult = null
            } = await plantnetApiService.plantnetIdentify(identifyOptions);
            if (result === IDENTIFY_RESULT.OK) {
                const {scoredResult, firstImageOriginalUrl, firstImageText} = plantnetResult;
                return await plantnetCommonService.replyToWithIdentificationResult(candidate,
                    {tags, doSimulate, context},
                    {scoredResult, firstImageOriginalUrl, firstImageText}
                );
            } else if (result === IDENTIFY_RESULT.BAD_SCORE) {
                return await plantnetCommonService.handleWithoutScoredResult(
                    {doSimulate, "candidate": parentPost, "replyTo": candidate, "muteAuthor": false, context}
                );
            } else {
                if (result !== IDENTIFY_RESULT.NONE) {
                    logger.warn(`unable to handle plantnetService.plantnetIdentify result:${result} so consider it as NONE`);
                }
                return await plantnetCommonService.handleWithNoIdentificationResult(
                    {doSimulate, "candidate": parentPost, "replyTo": candidate, "muteAuthor": false, context}
                );
            }
        } catch (err) {
            return this.rejectWithIdentifyError(candidate, err, context);
        }
    }

    rejectNoCandidateParentImage(parentPost, context) {
        const reasonText = `aucune image pour Pl@ntNet dans ${postTextOf(parentPost)}`;
        const reasonHtml = `<b>Post</b>: <div class="bg-warning">${postHtmlOf(parentPost)}</div><b>Info</b>: aucune image`;
        this.logger.info(reasonText, context);
        return Promise.reject(pluginReject(reasonText, reasonHtml, 202, "no candidate parent image"));
    }

    resultNoCandidateParent(candidate, context) {
        const resultTxt = `aucun parent pour ${postTextOf(candidate)}`;
        const resultHtml = `aucun parent pour ${postHtmlOf(candidate)}`;
        this.logger.info(resultTxt, context);
        return Promise.resolve(pluginResolve(resultTxt, resultHtml, 202))
    }

    /**
     * iterate through plugin.ask to search next candidate
     *
     * @param config
     * @param bookmark
     * @returns {Promise<unknown>}
     */
    async searchNextAsk(config, bookmark = 0) {
        const {context, doSimulateSearch} = config;
        const {asks, blueskyService, logger} = this;
        if (doSimulateSearch) {
            await blueskyService.login();
            return Promise.resolve(loadJsonResource("src/data/blueskyPostFakeAskBot.json"));
        }
        let searchQuery = asks[bookmark];
        const hasNoReply = true;
        const isNotMuted = true;
        const maxHoursOld = 72;// now-24h ... now
        const askResults = await blueskyService.searchPosts({searchQuery, hasNoReply, isNotMuted, maxHoursOld});
        logger.info(`${askResults.length} candidate(s)`, context);
        if (arrayIsNotEmpty(askResults)) {
            return Promise.resolve(askResults[0]);
        }
        if (bookmark + 1 < this.asks.length) {
            const response = await this.searchNextAsk(config, bookmark + 1);
            return Promise.resolve(response);
        }
        return Promise.resolve(null);
    }

    rejectWithIdentifyError(candidate, err, context) {
        let plantnetTxtError = "Impossible d'identifier l'image avec Ask-Pl@ntNet";
        let plantnetHtmlError = plantnetTxtError;
        if (isSet(candidate)) {
            plantnetTxtError = `Impossible d'identifier l'image du parent de ${postLinkOf(candidate)} avec Ask-Pl@ntNet`;
            plantnetHtmlError = `<b>Post</b>: <div class="bg-warning">parent de ${postHtmlOf(candidate)}</div>` +
                `<b>Erreur</b>: impossible d'identifier l'image avec Ask-Pl@ntNet`;
        }
        this.logger.error(`${plantnetTxtError} : ${err.message}`, context);
        return Promise.reject(pluginReject(plantnetTxtError, plantnetHtmlError, 500, "unable to identify"));
    }
}
