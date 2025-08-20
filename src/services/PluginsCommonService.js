import {dataSimulationDirectory, pluginReject, pluginResolve} from "./BotService.js";
import {postAuthorOf, postHtmlOf, postImageOf, postInfoOf, postLinkOf, postTextOf} from "../domain/post.js";
import {isSet, loadJsonResource} from "../lib/Common.js";
import {arrayIsNotEmpty} from "../lib/ArrayUtil.js";

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
            hasImages = false, // need to be explicitly set
            hasNoReply = true,
            hasNoReplyFromBot = false,
            threadGetLimited = true,
            isNotMuted = true,
            maxHoursOld = 24
        } = config;
        if (doSimulateSearch && searchSimulationFile === null) {
            throw new Error("Unable to simulate search without simulation requirements");
        }
        if (doSimulateSearch) {
            await blueskyService.login();
            this.logger.info(`simulate search using ${searchSimulationFile}`, context);
            return Promise.resolve(loadJsonResource(`${dataSimulationDirectory}/${searchSimulationFile}.json`));
        }
        const candidatePosts = await blueskyService.searchPosts({
            searchQuery: questions[bookmark],
            hasImages,
            hasNoReply,
            hasNoReplyFromBot,
            threadGetLimited,
            isNotMuted,
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

    resultSimple(pluginName, context, resultSentence) {
        this.logger.info(resultSentence, context);
        return Promise.resolve(pluginResolve(resultSentence, resultSentence, 202))
    }

    resultNoCandidate(pluginName, context) {
        return this.resultSimple(pluginName, context, `aucun candidat pour ${pluginName}`)
    }

    rejectNoCandidateImage(pluginName, candidate, context) {
        const reasonText = `aucune image pour ${pluginName} dans ${postTextOf(candidate)}`;
        const reasonHtml = `<b>Post</b>: <div class="bg-warning">${postHtmlOf(candidate)}</div><b>Info</b>: aucune image pour ${pluginName}`;
        this.logger.info(reasonText, context);
        return Promise.reject(pluginReject(reasonText, reasonHtml, 202, "no candidate image"));
    }

    async resultNoCandidateParent(candidate, pluginName, context) {
        const authorAction = await this.safeMuteAuthor(true, candidate, `${pluginName} aucun parent`, context);
        const resultTxt = `aucun parent pour ${pluginName} pour ${postTextOf(candidate)}${authorAction}`;
        const resultHtml = `aucun parent pour ${pluginName} pour ${postHtmlOf(candidate)}${authorAction}`;
        this.logger.info(resultTxt, context);
        return Promise.resolve(pluginResolve(resultTxt, resultHtml, 202))
    }

    async rejectNoCandidateParentImage(candidate, parentPost, pluginName, context) {
        const authorAction = await this.safeMuteAuthor(true, candidate, `${pluginName} aucune image dans le parent`, context);
        const reasonText = `${pluginName} aucune image du parent de ${postTextOf(candidate)}${authorAction}`;
        const reasonHtml = `<b>Post</b>: <div class="bg-warning">${postHtmlOf(candidate)}</div><b>Info</b>: ${pluginName} aucune image du parent ${authorAction}`;
        this.logger.info(reasonText, context);
        return Promise.resolve(pluginReject(reasonText, reasonHtml, 202, "no candidate parent image"));
    }

    rejectWithParentIdentifyError(step, candidate, pluginName, err, context) {
        let askTxtError = `[${step}] Impossible d'identifier l'image avec ${pluginName}`;
        let askHtmlError = askTxtError;
        if (isSet(candidate)) {
            askTxtError = `[${step}] Impossible d'identifier l'image du parent de ${postLinkOf(candidate)} avec ${pluginName}`;
            askHtmlError = `<b>Post</b>: <div class="bg-warning">parent de ${postHtmlOf(candidate)}</div>` +
                `<b>Erreur [${step}]</b>: impossible d'identifier l'image avec ${pluginName}`;
        }
        this.logger.error(`${askTxtError} : ${askTxtError} // message was: ${err.message}`, context);
        return Promise.reject(pluginReject(askTxtError, askHtmlError, 500, "unable to identify", true));
    }

    logCandidate(pluginName, candidate, candidatePhoto, context) {
        this.logger.debug(`post Candidate : ${postLinkOf(candidate)}\n` +
            `\t${postInfoOf(candidate)}\n` +
            `\t${postImageOf(candidatePhoto)}`, context);
    }

    rejectWithIdentifyError(pluginName, step, candidate, err, context) {
        let {status, message, mustBeReported} = err;
        mustBeReported = isSet(mustBeReported) ? mustBeReported : true;
        let pluginTxtError = `[${step}] Impossible d'identifier l'image avec ${pluginName}`;
        let pluginHtmlError = pluginTxtError;
        if (isSet(candidate)) {
            pluginTxtError = `[${step}] Impossible d'identifier l'image de ${postLinkOf(candidate)} avec ${pluginName}`;
            pluginHtmlError = `<b>Post</b>: <div class="bg-warning">${postHtmlOf(candidate)}</div>` +
                `<b>Erreur [${step}]</b>: impossible d'identifier l'image avec ${pluginName}`;
        }
        this.logger.error(`${pluginTxtError} : ${message}`, context);
        return Promise.reject(pluginReject(pluginTxtError, pluginHtmlError,
            isSet(status) ? status : 500,
            `${pluginName} unexpected error`, mustBeReported));
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
                `<b>Post</b>:<div class="news-negative"><div class="bg-info">${postHtmlOf(candidate)}</div> ${negativeText}${authorAction}</div>`
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
                `<b>Post</b>:<div class="news-negative"><div class="bg-info">${replyToHtmlOf}</div><b>${replySent}</b>: ${replyMessage}${authorAction}</div>`,
                200,
                doSimulate ? 0 : 1
            ));
        } catch (err) {
            this.logError("replyTo", err, {...context, doSimulate, candidate, replyMessage});
            return Promise.reject(new Error("impossible de répondre au post"));
        }
    }

    async safeMuteAuthor(muteAuthor, candidate, reason, context) {
        const authorAction = muteAuthor ? " (auteur masqué)" : "";
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
                    console.log(err);// print err
                    console.log(err?.stack);// print stack
                    console.trace();// print stack
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