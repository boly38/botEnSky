import {arrayIsNotEmpty, clone, isSet, loadJsonResource} from "../lib/Common.js";
import {firstImageOf, postHtmlOf, postImageOf, postInfoOf, postLinkOf, postTextOf} from "../domain/post.js";
import TinyURL from "tinyurl";

const PLANTNET_MINIMAL_PERCENT = 20;
const PLANTNET_MINIMAL_RATIO = PLANTNET_MINIMAL_PERCENT / 100;

export default class Plantnet {
    constructor(config, loggerService, blueskyService, plantnetService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'Pl@ntNet'});
        this.logger.level = "INFO"; // DEBUG will show search results
        this.blueskyService = blueskyService;
        this.plantnetSimulate = (config.bot.plantnetSimulate === true);
        this.plantnetService = plantnetService;
        try {
            this.questions = loadJsonResource('src/data/questionsPlantnet.json');
            this.isAvailable = plantnetService.isReady();
            this.logger.info((this.isAvailable ? "available" : "not available") +
                " with " + this.questions.length + " questions");
        } catch (exception) {
            this.logError("init", exception);
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

    process(config) {
        const plugin = this;
        let {pluginTags, pluginMoreTags, doSimulate, simulateIdentifyCase, context} = config;
        if (config.pluginName === undefined) {
            config.pluginName = plugin.getName();
        }
        if (pluginTags === undefined) {
            pluginTags = plugin.getPluginTags();
        }
        if (pluginMoreTags !== undefined) {
            pluginTags = [pluginTags, pluginMoreTags].join(' ');
        }
        // if at least one want to simulate then simulate
        const doSimulateIdentify = plugin.plantnetSimulate || isSet(simulateIdentifyCase);
        return new Promise((resolve, reject) => {
            plugin.searchNextCandidate(config)
                .then(candidate => {
                    const candidatePhoto = firstImageOf(candidate);
                    if (!candidatePhoto) {
                        plugin.logger.info("no candidate image", context);
                        throw {"message": `aucune image pour Pl@ntNet dans ${postLinkOf(candidate)}`, "status": 202};
                    }
                    plugin.logger.debug(`post Candidate : ${postLinkOf(candidate)}\n` +
                        `\t${postInfoOf(candidate)}\n` +
                        `\t${postImageOf(candidatePhoto)}`, context);

                    const candidateImageFullsize = candidatePhoto?.fullsize;

                    const identifyOptions = {
                        "image": candidateImageFullsize,
                        doSimulate,
                        doSimulateIdentify,
                        simulateIdentifyCase,
                        candidate,
                        "tags": pluginTags,
                        context
                    };
                    plugin.logger.debug(`identifyOptions : ${identifyOptions}`, context);
                    plugin.plantnetIdentify(identifyOptions)
                        .then(resolve)
                        .catch(reject)
                })
                .catch(reject);
        });
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
    searchNextCandidate(config, bookmark = 0) {
        const plugin = this;
        const {pluginName, context} = config;
        return new Promise((resolve, reject) => {
            let searchQuery = plugin.questions[bookmark];
            if (config.searchExtra) {
                searchQuery += " " + config.searchExtra;
            }
            const hasImages = true;
            const hasNoReply = true;
            const maxHoursOld = 24;// now-24h ... now
            plugin.blueskyService.searchPosts({searchQuery, hasImages, hasNoReply, maxHoursOld})
                .then(candidatePosts => {
                    plugin.logger.info(`${candidatePosts.length} candidate(s)`, context);
                    if (arrayIsNotEmpty(candidatePosts)) {
                        resolve(candidatePosts[0]);
                        return;
                    }
                    if (bookmark + 1 < plugin.questions.length) {
                        plugin.searchNextCandidate(config, bookmark + 1)
                            .then(resolve)
                            .catch(reject);
                        return;
                    }
                    plugin.logger.info(`no candidate for ${pluginName}`, context);
                    throw {"message": `aucun candidat pour ${pluginName}`, "status": 202};
                })
                .catch(reject)
        });
    }

    plantnetIdentify(options) {
        const plugin = this;
        const {image, doSimulate, doSimulateIdentify, simulateIdentifyCase, candidate, context} = options;

        return new Promise((resolve, reject) => {
            plugin.plantnetService.identify({"imageUrl": image, doSimulateIdentify, simulateIdentifyCase})
                .then(plantResult => {
                    plugin.logger.debug(`plantnetResult : ${JSON.stringify(plantResult)}`, context);
                    const firstScoredResult = plugin.plantnetService.hasScoredResult(plantResult, PLANTNET_MINIMAL_RATIO);
                    if (!firstScoredResult) {
                        plugin.resolveWithoutScoredResult(options).then(resolve).catch(reject);
                        return;
                    }
                    plugin.replyScoredResultWithImage(options, firstScoredResult).then(resolve).catch(reject);
                })
                .catch(err => {
                    plugin.logError("plantnetService.identify", err, {...context, image, doSimulate});
                    if (err?.status === 404) {
                        plugin.resolveWithNoIdentificationResult(options).then(resolve);
                        return
                    }
                    reject({
                        "message": "impossible d'identifier l'image",
                        "html": `<b>Post</b>: <div class="bg-warning">${postHtmlOf(candidate)}</div>` +
                            `<b>Erreur</b>: impossible d'identifier l'image`,
                        "status": 500
                    });
                });
        });
    }

    buildShortUrlWithText(imageUrl, text) {
        let service = this;
        return new Promise(resolve => {
            if (imageUrl === null) {
                return resolve(false);
            }
            TinyURL.shorten(imageUrl)
                .then(shortenUrl => resolve(`${text}\n${shortenUrl}`))
                .catch(err => {
                    service.logger.warn(`Unable to use tinyUrl for this url : ${imageUrl} - details: ${err?.message}`);
                    resolve(`${text}\n${imageUrl}`);
                });
        });
    }

    replyScoredResultWithImage(options, firstScoredResult) {
        const plugin = this;
        const {tags} = options;
        return new Promise((resolve, reject) => {
            const scoredResultSummary = 'Pl@ntNet identifie ' + plugin.plantnetService.resultInfoOf(firstScoredResult);
            const firstImage = plugin.plantnetService.resultFirstImage(firstScoredResult);
            const firstImageOriginalUrl = plugin.plantnetService.resultImageOriginalUrl(firstImage);
            // Case 1 : score result without image as example
            if (!isSet(firstImage) || !isSet(firstImageOriginalUrl)) {
                let replyMessage = `${scoredResultSummary}\n\n${tags}`;
                plugin.replyResult(options, replyMessage)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            // Case 2 : score result with image
            const firstImageAltText = plugin.plantnetService.resultImageToAlternateText(firstImage, scoredResultSummary);
            this.blueskyService.prepareImageUrlAsBlueskyEmbed(firstImageOriginalUrl, firstImageAltText)
                .then(embed => {
                    // Case 2a : image embedded into reply post
                    let replyMessage = `${scoredResultSummary}\n\n${tags}`;
                    plugin.replyResult(options, replyMessage, embed)
                        .then(resolve)
                        .catch(reject);
                })
                .catch(err => {
                    // Case 2b : image as text link into reply post
                    plugin.logger.info(`Unable to make bluesky embed of image ${firstImageOriginalUrl}, so keep it as text link: ${err.message}`);
                    const firstImageShortText = plugin.plantnetService.resultImageToText(firstImage);
                    plugin.buildShortUrlWithText(firstImageOriginalUrl, firstImageShortText)
                        .then(illustrateImage => {
                            let withImageLink = (illustrateImage ? "\n\n" + illustrateImage : "")
                            let replyMessage = `${scoredResultSummary}\n${withImageLink} \n\n${tags}`;
                            plugin.replyResult(options, replyMessage)
                                .then(resolve)
                                .catch(reject);
                        })
                        .catch(reject);
                })

        });
    }

    resolveWithNoIdentificationResult(options) {
        const {candidate} = options;
        const candidateHtmlOf = postHtmlOf(candidate);
        const candidateTextOf = postTextOf(candidate);
        const noIdentificationText = " ne donne aucune identification Pl@ntNet";
        return Promise.resolve({
            "html": `<b>Post</b>:<div class="bg-info">${candidateHtmlOf}</div> ${noIdentificationText}`,
            "text": `Post:\n\t${candidateTextOf}\n\t${noIdentificationText}`
        });
    }

    resolveWithoutScoredResult(options) {
        const {candidate} = options;
        const candidateHtmlOf = postHtmlOf(candidate);
        const candidateTextOf = postTextOf(candidate);
        const noIdentificationGoodScoreText = `L'identification par Pl@ntNet n'a pas donné de résultat assez concluant 😩 (score<${PLANTNET_MINIMAL_PERCENT}%)`;
        return Promise.resolve({
            "html": `<b>Post</b>:<div class="bg-info">${candidateHtmlOf}</div> ${noIdentificationGoodScoreText}`,
            "text": `Post:\n\t${candidateTextOf}\n\t${noIdentificationGoodScoreText}`
        });
    }

    replyResult(options, replyMessage, embed = null) {
        const plugin = this;
        const {doSimulate, candidate, context} = options;
        plugin.logger.debug("reply result",
            JSON.stringify({doSimulate, replyMessage, candidate}, null, 2)
        );
        return new Promise((resolve, reject) => {
            this.blueskyService.replyTo(candidate, replyMessage, doSimulate, embed)
                .then(() => {
                    const candidateHtmlOf = postHtmlOf(candidate);
                    const candidateTextOf = postTextOf(candidate);
                    const replySent = doSimulate ? "SIMULATION - Réponse prévue" : "Réponse émise";
                    resolve({
                        "html": `<b>Post</b>:<div class="bg-info">${candidateHtmlOf}</div><b>${replySent}</b>: ${replyMessage}`,
                        "text": `Post:\n\t${candidateTextOf}\n\t${replySent} : ${replyMessage}`
                    })
                })
                .catch(err => {
                    plugin.logError("replyTo", err, {...context, doSimulate, candidate, replyMessage});
                    reject({"message": "impossible de répondre au post", "status": 500});
                });
        });
    }

    logError(action, err, context) {
        if (Object.keys(err) && Object.keys(err).length > 0) {
            this.logger.error(`${action} ${JSON.stringify(err, null, 2)}`, {...context, action});
            return;
        }
        this.logger.error(`${action} ${err}`, {...context, action});
    }
}
