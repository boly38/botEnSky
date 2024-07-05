import {dataSimulationDirectory, pluginReject, pluginResolve} from "./BotService.js";
import {postAuthorOf, postHtmlOf, postImageOf, postInfoOf, postLinkOf, postTextOf} from "../domain/post.js";
import {arrayIsNotEmpty, isSet, loadJsonResource} from "../lib/Common.js";

export default class PluginsCommonService {
    constructor(loggerService, auditLogsService, blueskyService) {
        this.logger = loggerService.getLogger().child({label: 'PluginsCommonService'});
        this.auditLogsService = auditLogsService;
        this.blueskyService = blueskyService;
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
     * @returns {Promise<unknown>}
     */
    async searchNextCandidate(config) {
        const {blueskyService, logger} = this;
        logger.debug(`searchNextCandidate:${JSON.stringify(config)}`)
        let {
            context,
            questions,
            bookmark = 0,
            doSimulateSearch = false,
            searchSimulationFile = null,
            maxHoursOld = 24
        } = config;
        if (doSimulateSearch && searchSimulationFile === null) {
            throw new Error("Unable to simulate search without simulation requirements");
        }
        if (doSimulateSearch) {
            await blueskyService.login();
            return Promise.resolve(loadJsonResource(`${dataSimulationDirectory}/${searchSimulationFile}.json`));
        }
        const candidatePosts = await blueskyService.searchPosts({
            searchQuery: questions[bookmark],
            "hasImages": true,
            "hasNoReply": true,
            "isNotMuted": true,
            maxHoursOld// now-<maxHoursOld>h ... now
        })
        logger.info(`${candidatePosts.length} candidate(s)`, context);
        if (arrayIsNotEmpty(candidatePosts)) {
            return Promise.resolve(candidatePosts[0]);
        }
        bookmark++;
        if (bookmark < questions.length) {
            config.bookmark = bookmark;
            return await this.searchNextCandidate(config)
        }
        return Promise.resolve(null);
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
        return Promise.reject(pluginReject(plantnetTxtError, plantnetHtmlError, 500, `${pluginName} unexpected error`));
    }

    async handleWithoutScoredResult(pluginName, minimalPercent, options) {
        return await this.handleNegativeIdentification(options,
            `L'identification par ${pluginName} n'a pas donné de résultat assez concluant 😩 (score<${minimalPercent}%)`
        );
    }

    async handleWithNoIdentificationResult(pluginName, options) {
        return await this.handleNegativeIdentification(options,
            `L'identification par ${pluginName} ne donne aucun résultat`
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
                `<b>Post</b>:<div class="bg-info">${replyToHtmlOf}</div><b>${replySent}</b>: ${replyMessage}${authorAction}`,
                200,
                doSimulate ? 0 : 1
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
        const {
            doSimulate, context,
            imageUrl = null,
            imageAlt = "post-image"
        } = options;
        plugin.logger.debug("reply result",
            JSON.stringify({doSimulate, replyMessage, replyTo}, null, 2)
        );
        return new Promise((resolve, reject) => {
            this.blueskyService.replyTo(replyTo, replyMessage, doSimulate, embed)
                .then(() => {
                    const candidateHtmlOf = postHtmlOf(replyTo);
                    const candidateTextOf = postTextOf(replyTo);
                    const imageHtml = plugin.imageHtmlOf(imageUrl, imageAlt);
                    const replySent = doSimulate ? "SIMULATION - Réponse prévue" : "Réponse émise";
                    resolve(pluginResolve(
                        `Post:\n\t${candidateTextOf}\n\t${replySent} : ${replyMessage}`,
                        `<b>Post</b>:<div class="bg-info">${candidateHtmlOf}</div>${imageHtml}<b>${replySent}</b>: ${replyMessage}`,
                        200,
                        doSimulate ? 0 : 1
                    ));
                })
                .catch(err => {
                    plugin.logError("replyTo", err, {...context, doSimulate, replyTo, replyMessage});
                    reject(new Error("impossible de répondre au post"));
                });
        });
    }

    logError(action, err, context) {
        this.logger.error(`${action} ${err.message}`, {...context, action});
        this.auditLogsService.createAuditLog(`${action} ${err} ${JSON.stringify(context)}`);
    }

    imageHtmlOf(imageUrl = null, imageAlt = "post-image") {
        if (imageUrl === null) {
            return "";
        }
        return `<div class="post-image-container"><a href="${imageUrl}" target="_img"><img src="${imageUrl}" class="post-image" alt="${imageAlt}" title="${imageAlt}"/></a></div>`
    }

}