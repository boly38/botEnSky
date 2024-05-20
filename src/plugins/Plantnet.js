import log4js from 'log4js';
import {arrayIsNotEmpty, clone, loadJsonResource} from "../lib/Common.js";
import {firstImageOf, postHtmlOf, postImageOf, postInfoOf, postLinkOf, postTextOf} from "../domain/post.js";
import {isSet} from "node:util/types";

const PLANTNET_MINIMAL_PERCENT = 20;
const PLANTNET_MINIMAL_RATIO = PLANTNET_MINIMAL_PERCENT / 100;
const BES_ROUTE = "Bon 🥾 je trace ma route, bonne journée 😊 !";

export default class Plantnet {
    constructor(config, blueskyService, plantnetService) {
        this.isAvailable = false;
        this.logger = log4js.getLogger('Plantnet');
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
        let {pluginName, pluginTags, pluginMoreTags, doSimulate, simulateIdentifyCase} = config;
        if (config.pluginName === undefined) {
            pluginName = plugin.getName();
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
            // OR NO SUPPORTED / const allQuestions = "(\"" + plugin.questions.join("\" OR \"") + "\")" + " \"?\"";
            let searchQuery = plugin.questions[0];
            if (config.searchExtra) {
                searchQuery += " " + config.searchExtra;
            }
            const hasImages = true;
            const hasNoReply = true;
            const maxHoursOld = 24;// now-24h ... now
            plugin.blueskyService.searchPosts({searchQuery, hasImages, hasNoReply, maxHoursOld})
                .then(candidatePosts => {
                    if (!arrayIsNotEmpty(candidatePosts)) {
                        plugin.logger.info(`no candidate for ${pluginName}`);
                        throw {"message": `aucun candidat pour ${pluginName}`, "status": 202};
                    }
                    // arrayIsNotEmpty(candidatePosts)
                    const candidate = candidatePosts[0];
                    const candidatePhoto = firstImageOf(candidate);
                    if (!candidatePhoto) {
                        plugin.logger.info("no candidate image");
                        throw{"message": `aucune image pour pl@ntnet dans ${postLinkOf(candidate)}`, "status": 202};
                    }
                    plugin.logger.info(`post Candidate : ${postLinkOf(candidate)}\n` +
                        `\t${postInfoOf(candidate)}\n` +
                        `\t${postImageOf(candidatePhoto)}`);

                    const candidateImageFullsize = candidatePhoto?.fullsize;

                    const identifyOptions = {
                        "image": candidateImageFullsize,
                        doSimulate,
                        doSimulateIdentify,
                        simulateIdentifyCase,
                        candidate,
                        "tags": pluginTags
                    };
                    plugin.logger.debug("identifyOptions : ", identifyOptions);
                    plugin.plantnetIdentify(identifyOptions)
                        .then(resolve)
                        .catch(reject)
                })
                .catch(reject);
        });
    }

    plantnetIdentify(options) {
        const plugin = this;
        const {image, doSimulate, doSimulateIdentify, simulateIdentifyCase, candidate} = options;

        return new Promise((resolve, reject) => {
            plugin.plantnetService.identify({"imageUrl": image, doSimulateIdentify, simulateIdentifyCase})
                .then(plantResult => {
                    plugin.logger.debug("plantnetResult : " + JSON.stringify(plantResult));
                    const firstScoredResult = plugin.plantnetService.hasScoredResult(plantResult, PLANTNET_MINIMAL_RATIO);
                    if (!firstScoredResult) {
                        plugin.replyNoScoredResult(options).then(resolve).catch(reject);
                        return;
                    }
                    plugin.replyScoredResult(options, firstScoredResult).then(resolve).catch(reject);
                })
                .catch(err => {
                    plugin.logError("plantnetService.identify", {image, doSimulate, err});
                    if (err?.status === 404) {
                        plugin.noIdentificationResult(options).then(resolve);
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

    replyScoredResult(options, firstScoredResult) {
        const plugin = this;
        const {tags} = options;
        return new Promise((resolve, reject) => {
            plugin.plantnetService.resultImageOf(firstScoredResult)
                .then(illustrateImage => {
                    let scoredResultSummary = plugin.plantnetService.resultInfoOf(firstScoredResult);
                    let withImageLink = (illustrateImage ? "\n\n" + illustrateImage : "")
                    let replyMessage = `Pl@ntnet identifie ${scoredResultSummary}\n${withImageLink} \n\n${tags}`;
                    plugin.replyResult(options, replyMessage)
                        .then(resolve)
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    noIdentificationResult(options) {
        const {candidate} = options;
        const candidateHtmlOf = postHtmlOf(candidate);
        const candidateTextOf = postTextOf(candidate);
        const noIdentificationText = " ne donne aucune identification";
        return Promise.resolve({
            "html": `<b>Post</b>:<div class="bg-info">${candidateHtmlOf}</div> ${noIdentificationText}`,
            "text": `Post:\n\t${candidateTextOf}\n\t${noIdentificationText}`
        });
    }

    replyNoScoredResult(options) {
        const {tags} = options;
        const replyMessage = `Bonjour, une interrogation de Pl@ntnet (1ère image)` +
            ` n'a pas donné de résultat concluant 😩 (score>${PLANTNET_MINIMAL_PERCENT}%).\n` +
            // `Info: bien cadrer la fleur ou feuille\n\n${tags}`;
            `${BES_ROUTE}\n\n${tags}`;
        return this.replyResult(options, replyMessage);
    }

    replyResult(options, replyMessage) {
        const plugin = this;
        const {doSimulate, candidate} = options;
        plugin.logger.debug("reply result",
            JSON.stringify({doSimulate, replyMessage, candidate}, null, 2)
        );
        return new Promise((resolve, reject) => {
            this.blueskyService.replyTo(candidate, replyMessage, doSimulate)
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
                    plugin.logError("replyTo", err);
                    plugin.logError("replyTo context", {doSimulate, candidate, replyMessage});
                    reject({"message": "impossible de répondre au post", "status": 500});
                });
        });
    }

    logError(action, err) {
        if (Object.keys(err) && Object.keys(err).length > 0) {
            this.logger.error(action, JSON.stringify(err, null, 2));
            return;
        }
        this.logger.error(action, err);
    }
}
