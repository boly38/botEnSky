import {pluginReject, pluginResolve} from "./BotService.js";
import {postAuthorOf, postHtmlOf, postImageOf, postInfoOf, postLinkOf, postTextOf} from "../domain/post.js";
import {isSet} from "../lib/Common.js";
import TinyURL from "tinyurl";
import {PLANTNET_MINIMAL_PERCENT} from "./PlantnetApiService.js";

export default class PlantnetCommonService {
    constructor(loggerService, auditLogsService, blueskyService) {
        this.logger = loggerService.getLogger().child({label: 'PlantnetCommonService'});
        this.auditLogsService = auditLogsService;
        this.blueskyService = blueskyService;
    }

    resultNoCandidate(pluginName, context) {
        const result = `aucun candidat pour ${pluginName}`;
        this.logger.info(result, context);
        return Promise.resolve(pluginResolve(result, result, 202))
    }

    rejectNoCandidateImage(pluginName, candidate, context) {
        const reasonText = `aucune image pour Pl@ntNet dans ${postTextOf(candidate)}`;
        const reasonHtml = `<b>Post</b>: <div class="bg-warning">${postHtmlOf(candidate)}</div><b>Info</b>: aucune image`;
        this.logger.info(reasonText, context);
        return Promise.reject(pluginReject(reasonText, reasonHtml, 202, "no candidate image"));
    }

    logCandidate(pluginName, candidate, candidatePhoto, context) {
        this.logger.debug(`post Candidate : ${postLinkOf(candidate)}\n` +
            `\t${postInfoOf(candidate)}\n` +
            `\t${postImageOf(candidatePhoto)}`, context);

    }


    rejectWithIdentifyError(pluginName, candidate, err, context) {
        let plantnetTxtError = `Impossible d'identifier l'image avec ${pluginName}`;
        let plantnetHtmlError = plantnetTxtError;
        if (isSet(candidate)) {
            plantnetTxtError = `Impossible d'identifier l'image de ${postLinkOf(candidate)} avec ${pluginName}`;
            plantnetHtmlError = `<b>Post</b>: <div class="bg-warning">${postHtmlOf(candidate)}</div>` +
                `<b>Erreur</b>: impossible d'identifier l'image avec ${pluginName}`;
        }
        this.logger.error(`${plantnetTxtError} : ${err.message}`, context);
        return Promise.reject(pluginReject(plantnetTxtError, plantnetHtmlError, 500, "unable to identify"));
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

    async replyToWithIdentificationResult(replyTo, options, pnResult) {
        const {tags, doSimulate, context} = options;
        const {scoredResult, firstImageOriginalUrl, firstImageText} = pnResult

        let replyMessage = `${scoredResult}\n\n${tags}`;
        if (isSet(firstImageOriginalUrl)) {// score result with image
            const firstImageAltText = `${firstImageText} comme image exemple pour le résultat suivant: ${scoredResult}`;
            try {
                const embed = await this.blueskyService.prepareImageUrlAsBlueskyEmbed(firstImageOriginalUrl, firstImageAltText)
                // image embedded into reply post
                return await this.replyResult(replyTo, {doSimulate, context}, replyMessage, embed);
            } catch (embedErr) {
                // image as text link into reply post
                this.logger.info(`Unable to make bluesky embed of image ${firstImageOriginalUrl}, so keep it as text link: ${embedErr.message}`);
                const illustrateImage = await this.buildShortUrlWithText(firstImageOriginalUrl, firstImageText)
                const withImageLink = (illustrateImage ? "\n\n" + illustrateImage : "")
                replyMessage = `${scoredResult}\n${withImageLink} \n\n${tags}`;
                return await this.replyResult(replyTo, {doSimulate, context}, replyMessage);
            }
        }
        // score result without image
        return await this.replyResult(replyTo, {doSimulate, context}, replyMessage);
    }

    async handleWithoutScoredResult(options) {
        return await this.handleNegativeIdentification(options,
            `L'identification par Pl@ntNet n'a pas donné de résultat assez concluant 😩 (score<${PLANTNET_MINIMAL_PERCENT}%)`
        );
    }

    async handleWithNoIdentificationResult(options) {
        return await this.handleNegativeIdentification(options,
            `L'identification par Pl@ntNet ne donne aucun résultat`
        );
    }

    async handleNegativeIdentification(options, negativeText) {
        const {doSimulate, candidate, replyTo, muteAuthor, context} = options; // we don't forward tags to the reply
        // mute
        const authorAction = await this.safeMuteAuthor(muteAuthor, candidate, negativeText, context);
        // when no answer
        if (!isSet(replyTo)) {
            return Promise.resolve(pluginResolve(
                `Post:\n\t${postTextOf(candidate)}\n\t${negativeText}${authorAction}`,
                `<b>Post</b>:<div class="bg-info">${postHtmlOf(candidate)}</div> ${negativeText}${authorAction}`
            ));
        }
        // else when answer
        const replyMessage = negativeText;
        try {
            await this.blueskyService.replyTo(replyTo, replyMessage, doSimulate);
            const replyToHtmlOf = postHtmlOf(replyTo);
            const replyToTextOf = postTextOf(replyTo);
            const replySent = doSimulate ? "SIMULATION - Réponse prévue" : "Réponse émise";
            return Promise.resolve(pluginResolve(
                `Post:\n\t${replyToTextOf}\n\t${replySent} : ${replyMessage}${authorAction}`,
                `<b>Post</b>:<div class="bg-info">${replyToHtmlOf}</div><b>${replySent}</b>: ${replyMessage}${authorAction}`
            ));
        } catch (err) {
            this.logError("replyTo", err, {...context, doSimulate, candidate, replyMessage});
            return Promise.reject(new Error("impossible de répondre au post"));
        }
    }

    async safeMuteAuthor(muteAuthor, candidate, reason, context) {
        const authorAction = muteAuthor ? "(auteur masqué)" : "";
        if (muteAuthor) {
            await this.blueskyService.safeMuteCandidateAuthor(postAuthorOf(candidate), reason, context);
        }
        return authorAction;
    }
    replyResult(replyTo, options, replyMessage, embed = null) {
        const plugin = this;
        const {doSimulate,context} = options;
        plugin.logger.debug("reply result",
            JSON.stringify({doSimulate, replyMessage, replyTo}, null, 2)
        );
        return new Promise((resolve, reject) => {
            this.blueskyService.replyTo(replyTo, replyMessage, doSimulate, embed)
                .then(() => {
                    const candidateHtmlOf = postHtmlOf(replyTo);
                    const candidateTextOf = postTextOf(replyTo);
                    const replySent = doSimulate ? "SIMULATION - Réponse prévue" : "Réponse émise";
                    resolve(pluginResolve(
                        `Post:\n\t${candidateTextOf}\n\t${replySent} : ${replyMessage}`,
                        `<b>Post</b>:<div class="bg-info">${candidateHtmlOf}</div><b>${replySent}</b>: ${replyMessage}`
                    ));
                })
                .catch(err => {
                    plugin.logError("replyTo", err, {...context, doSimulate, replyTo, replyMessage});
                    reject(new Error("impossible de répondre au post"));
                });
        });
    }

    logError(action, err, context) {
        if (Object.keys(err) && Object.keys(err).length > 0) {
            this.logger.error(`${action} ${JSON.stringify(err, null, 2)}`, {...context, action});
            this.auditLogsService.createAuditLog(`${action} ${JSON.stringify(err, null, 2)}`);
            return;
        }
        this.logger.error(`${action} ${err}`, {...context, action});
        this.auditLogsService.createAuditLog(`${action} ${err} ${JSON.stringify(context)}`);
    }

}
