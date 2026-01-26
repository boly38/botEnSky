import {clone, isSet, loadJsonResource} from "../lib/Common.js";
import {firstImageOf, postImageOf, postInfoOf, postLinkOf, postTextOf} from "../domain/post.js";
import {IDENTIFY_RESULT, PLANTNET_MINIMAL_PERCENT} from "../servicesExternal/PlantnetApiService.js";

export default class AskPlantnet {
    constructor(config, loggerService, blueskyService, pluginsCommonService, plantnetCommonService, plantnetApiService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'AskPl@ntNet'});
        this.blueskyService = blueskyService;
        this.plantnetSimulate = (config.bot.plantnetSimulate === true);
        this.pluginsCommonService = pluginsCommonService;
        this.plantnetCommonService = plantnetCommonService;
        this.plantnetApiService = plantnetApiService;
        try {
            this.asks = loadJsonResource('src/data/askPlantnet.json');
            this.isAvailable = plantnetApiService.isReady();
            this.logger.info((this.isAvailable ? "available" : "not available") +
                " with " + this.asks.length + " asks");
        } catch (exception) {
            pluginsCommonService.logError("init", exception);
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
        const {
            plantnetSimulate, pluginsCommonService, plantnetCommonService, plantnetApiService, blueskyService,
            logger, "asks": questions
        } = this;
        const doSimulateIdentify = plantnetSimulate || isSet(simulateIdentifyCase);// if at least one want to simulate then simulate
        let candidate = null;
        let step = "searchNextCandidate";
        try {
            const maxHoursOld = 72;
            const hasNoReply = false;
            const hasNoReplyFromBot = true;
            const threadGetLimited = true;
            // keep hasImages=false as this is mention post's parent which include flower image
            const candidate = await pluginsCommonService.searchNextCandidate({...config, questions, maxHoursOld,
                hasNoReply, hasNoReplyFromBot, threadGetLimited});
            if (candidate === null) {
                return pluginsCommonService.resultNoCandidate(pluginName, context);
            }
            step = "getParentPostOf";
            const parentPost = await blueskyService.getParentPostOf(candidate.uri);
            if (parentPost === null) {
                return await pluginsCommonService.resultNoCandidateParent(candidate, pluginName, context);
            }
            // logger.info(parentPost);
            logger.debug(`CANDIDATE's PARENT:${parentPost ? postTextOf(parentPost) : "NONE"}`);
            step = "firstImageOf";
            const parentPhoto = firstImageOf(parentPost);
            if (!parentPhoto) {
                return await pluginsCommonService.rejectNoCandidateParentImage(candidate, parentPost, pluginName, context);
            }
            logger.debug(`post Candidate Parent : ${postLinkOf(parentPost)}\n` +
                `\t${postInfoOf(parentPost)}\n` +
                `\t${postImageOf(parentPhoto)}`, context);

            step = "plantnetIdentify";
            const tags = this.getPluginTags();

            // Log diagnostic info before identification
            logger.info(`[DIAGNOSTIC] Candidate (mention post): ${postLinkOf(candidate)}`, context);
            logger.info(`[DIAGNOSTIC] Parent post (image source): ${postLinkOf(parentPost)}`, context);
            logger.info(`[DIAGNOSTIC] Image to analyze: ${parentPhoto?.fullsize}`, context);

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

            step = "handle plantnetIdentification response";
            if (result === IDENTIFY_RESULT.OK) {
                const {scoredResult, firstImageOriginalUrl, firstImageText} = plantnetResult;

                // Log diagnostic info before replying
                logger.info(`[DIAGNOSTIC] Identification successful: ${scoredResult}`, context);
                logger.info(`[DIAGNOSTIC] Will reply to: ${postLinkOf(candidate)} (mention post from user who asked)`, context);
                logger.info(`[DIAGNOSTIC] Image was from: ${postLinkOf(parentPost)} (parent post with image)`, context);

                return await plantnetCommonService.replyToWithIdentificationResult(candidate,
                    {tags, doSimulate, context},
                    {scoredResult, firstImageOriginalUrl, firstImageText}
                );
            } else if (result === IDENTIFY_RESULT.BAD_SCORE) {
                return await pluginsCommonService.handleWithoutScoredResult(pluginName, PLANTNET_MINIMAL_PERCENT,
                    {doSimulate, "candidate": parentPost, "replyTo": candidate, "muteAuthor": false, context}
                );
            } else {
                if (result !== IDENTIFY_RESULT.NONE) {
                    logger.warn(`unable to handle plantnetService.plantnetIdentify result:${result} so consider it as NONE`);
                }
                return await pluginsCommonService.handleWithNoIdentificationResult(pluginName,
                    {doSimulate, "candidate": parentPost, "replyTo": candidate, "muteAuthor": false, context}
                );
            }
        } catch (err) {
            // DEBUG / console.log("stack >>", err.stack);// print stack
            return pluginsCommonService.rejectWithParentIdentifyError(step, candidate, pluginName, err, context);
        }
    }

}
