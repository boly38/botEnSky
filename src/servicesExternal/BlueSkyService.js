import {BskyAgent, RichText} from '@atproto/api'
import {descriptionOfPostAuthor, didOfPostAuthor, postLinkOf, postsFilterSearchResults} from "../domain/post.js";
import {
    BOT_HANDLE,
    getEncodingBufferAndBase64FromUri,
    isSet,
    nowISO8601,
    nowMinusHoursUTCISO,
    timeout
} from "../lib/Common.js";
import InternalServerErrorException from "../exceptions/ServerInternalErrorException.js";
import ServiceUnavailableException from "../exceptions/ServiceUnavailableException.js";

const BLUESKY_POST_LENGTH_MAX = 300;// https://github.com/bluesky-social/bsky-docs/issues/162

export default class BlueSkyService {
    constructor(config, loggerService) {
        this.config = config;
        this.logger = loggerService.getLogger().child({label: 'BlueSkyService'});
        const {identifier, password, service, exclusions} = config.bluesky
        this.agent = new BskyAgent({service})
        this.api = this.agent.api;// inspired from https://github.com/skyware-js/bot/blob/main/src/bot/Bot.ts#L324
        this.agentConfig = {identifier, password};
        this.profile = null;
        this.exclusions = isSet(exclusions) ? exclusions.split(",") : [];
        if (!this.exclusions.includes(identifier)) {
            this.exclusions.push(identifier);// exclude bot username to prevent "Ask" plugins from answering itself
        }
        this.logger.info(`exclusions: ${this.exclusions}`);
    }

    clearLogin() {
        this.profile = null;
    }

    login() {
        const bs = this;
        const {identifier, service} = this.config.bluesky
        if (bs.profile !== null) {
            this.logger.info(`login ${identifier}@${service} exists`);
            return Promise.resolve();// login already done
        }
        return new Promise((resolve, reject) => {
            this.logger.info(`login ${identifier}@${service}`);
            bs.agent.login(this.agentConfig)
                .then(loginResponse => {
                    bs.agent.getProfile({"actor": loginResponse.data.did})
                        .then(profileResponse => {
                            bs.profile = profileResponse;
                            resolve();
                        })
                        .catch(e => {
                            bs.logger.error(e);
                            reject(new Error("Failed to fetch bot profile. cf. logs."));
                        });
                })
                .catch(e => {
                    bs.logger.error(e);
                    reject(new Error("Failed to log in — double check your credentials and try again."));
                });
        });
    }

    /**
     * search on bluesky :
     * - official doc: https://docs.bsky.app/docs/api/app-bsky-feed-search-posts
     * - advanced search term : https://github.com/bluesky-social/social-app/issues/3378
     * @returns {Promise<void>}
     */
    async searchPosts(options = {}) {
        let {logger, exclusions} = this;
        const {
            searchQuery = "boly38",
            limit = 40,
            sort = "latest",// recent first
            hasImages = false,// does post include embed image
            hasNoReply = false,// does post has 0 reply
            hasNoReplyFromBot = false,// does post has 0 reply having current bot handle as author
            threadGetLimited = true,// limit to 1 result when ned to getThread to filter post
            isNotMuted = true,// is post muted by bot
            maxHoursOld = 1// restrict search time window "since" limit
        } = options;
        if (isSet(options.exclusions)) {
            exclusions = options.exclusions;
        }
        const since = isSet(maxHoursOld) ? nowMinusHoursUTCISO(maxHoursOld) : null;
        await this.login();
        let params = {q: searchQuery, sort, limit};
        if (isSet(since)) {
            params["since"] = since;
            params["until"] = nowMinusHoursUTCISO(0);
        }
        const response = await this.resilientSearchPostsWithRetry(params, {}, 2);
        let responsePosts = response?.data?.posts;
        // DEBUG FILTER // console.log(`filter : hasImages:${hasImages?"YES":"NO"}, hasNoReply:${hasNoReply?"YES":"NO"}, isNotMuted:${isNotMuted?"YES":"NO"}, exclusions:${exclusions}`)
        let filteredPosts = postsFilterSearchResults(responsePosts, hasImages, hasNoReply, isNotMuted, exclusions);
        filteredPosts = await this.postsFilterFromEachThread(filteredPosts, hasNoReplyFromBot, threadGetLimited);
        logger.info(`searchPosts ${JSON.stringify(params)} - ${responsePosts?.length} results, ${filteredPosts?.length} post-filter`);
        logger.debug(`posts : ` + JSON.stringify(filteredPosts, null, 2));
        return filteredPosts;
    }

    // https://github.com/bluesky-social/atproto/issues/2786 - bluesky api client should provide more than `TypeError: fetch failed`
    async resilientSearchPostsWithRetry(params, options, retryAttempts) {
        if (retryAttempts === 0) {
            throw new ServiceUnavailableException("Bluesky search service is not available for now.");
        }
        try {
            return await this.api.app.bsky.feed.searchPosts(params, options);
        } catch (error) {
            this.logger.warn(`resilientSearchPostsWithRetry ${retryAttempts} error:${error}`);
            if (error.message === "TypeError: fetch failed") {
                await this.safeSleepMs(5000);// await 5 sec before retrying
                return await this.resilientSearchPostsWithRetry(params, options, retryAttempts - 1);
            } else {
                throw error;
            }
        }
    }

    /**
     * filter given posts
     * @param posts post to filter
     * @param hasNoReplyFromBot when true retains only posts having NO reply ith bot as author
     * @param threadGetLimited when getPostThread is required by filter logic, and on first win,
     * we leave with first candidate to save some API call
     * @returns {Promise<*|Awaited<unknown>>}
     */
    async postsFilterFromEachThread(posts, hasNoReplyFromBot = false, threadGetLimited = true) {
        if (!hasNoReplyFromBot) {// no filter
            return posts;
        }
        let winnersPosts = [];
        for (const post of posts) {
            if ((await this.filterPostRepliesByAuthor(post.uri, BOT_HANDLE)).length === 0) {// post with 0 replies having bot a author
                winnersPosts.push(post);
                if (threadGetLimited) {
                    return winnersPosts;
                }
                await timeout(100);//~pseudo rate limit API call
            }
        }
        return winnersPosts;
    }

    getAllRepliesPosts(replies) {
        let allReplies = [];
        if (!replies) return allReplies;
        replies?.forEach(reply => {
            if (reply.post) {
                allReplies.push(reply.post)
            }
            if (reply.replies) {
                allReplies = allReplies.concat(this.getAllRepliesPosts(reply.replies));
            }
        });
        return allReplies;
    }

    async filterPostRepliesByAuthor(postUri, authorHandle) {
        // all reply via `getPostThread`
        // console.log(`filterPostRepliesByAuthor ${postUri} ${authorHandle}`);
        const reply = await this.api.app.bsky.feed.getPostThread({uri: postUri});
        // console.log(JSON.stringify(reply,null,2))
        const replies = reply?.data?.thread?.replies;
        const aggregatedRepliesPosts = this.getAllRepliesPosts(replies);
        // DEBUG // console.log(JSON.stringify(aggregatedRepliesPosts,null,2))
        if (!aggregatedRepliesPosts || aggregatedRepliesPosts.length === 0) { // no reply at all
            return [];
        }
        // filter reply by author only
        return aggregatedRepliesPosts.filter(reply => reply.author.handle === authorHandle);
    }

    /**
     * reply to a given POST with a given TEXT
     * bluesky replyTo doc : https://docs.bsky.app/docs/tutorials/creating-a-post#replies
     * To create facets, we may use dedicated tooling.
     *  - https://docs.bsky.app/docs/advanced-guides/posts#mentions-and-links
     *  - https://docs.bsky.app/docs/advanced-guides/post-richtext
     * @param post
     * @param text
     * @param doSimulate
     * @param embed
     * @returns {Promise<unknown>}
     */
    async replyTo(post, text, doSimulate, embed = null) { // TODO : , lang = "fr-FR"
        const {logger} = this;

        if (!isSet(text)) {
            throw new InternalServerErrorException(`Trying to replyTo with an empty content`);
        }

        if (text.length > BLUESKY_POST_LENGTH_MAX) {
            throw new InternalServerErrorException(`Trying to replyTo with a content length over the limits (${text.length} > ${BLUESKY_POST_LENGTH_MAX}:${text}`);
        }

        const {"uri": parentUri, "cid": parentCid} = post;
        const rootUri = post?.record?.reply?.root?.uri || parentUri;
        const rootCid = post?.record?.reply?.root?.cid || parentCid;

        //~ rich format
        const rt = new RichText({text})
        try {
            await rt.detectFacets(this.agent) // automatically detects mentions and links
        } catch (err) {
            logger.error(`detectFacets error ${err.message}`);
        }
        const replyPost = {
            "reply": {
                "root": {"uri": rootUri, "cid": rootCid},
                "parent": {"uri": parentUri, "cid": parentCid}
            },
            "$type": "app.bsky.feed.post",
            text: rt.text,
            facets: rt.facets,
            "createdAt": nowISO8601(), // ex. "2023-08-07T05:49:40.501974Z" OR new Date().toISOString()
            // TODO / "langs": [lang]
        };
        if (embed !== null) {
            replyPost.embed = embed;
        }

        if (doSimulate) {
            const embedDesc = embed !== null ? `\n[${embed["$type"]}|alt:${embed?.images[0]?.alt}]` : '';
            logger.info(`SIMULATE REPLY TO ${postLinkOf(post)} : ${text}${embedDesc}`);
            return {"uri": "simulated_reply_uri", "cid": "simulated_reply_cid"};
        }
        logger.debug("POST SENT:\n" + JSON.stringify(replyPost, null, 2));
        const postReplyResponse = await this.agent.post(replyPost)
        logger.info(`replyTo response : ${JSON.stringify(postReplyResponse)}`);
        logger.info(`replyTo ${postLinkOf(post)} : ${text}`);
        return postReplyResponse;
    }

    prepareImageUrlAsBlueskyEmbed(imageUri, imageAltText) {
        const bs = this;
        return new Promise((resolve, reject) => {
            getEncodingBufferAndBase64FromUri(imageUri)
                .then(result => {
                    const {encoding, buffer, base64} = result;
                    if (encoding === undefined) {
                        throw new Error("encoding is undefined");
                    }
                    if (base64?.length < 1) {
                        throw new Error("image is empty");
                    }
                    if (base64?.length > 1000000) {
                        throw new Error(`image file size too large (${base64?.length}). 1000000 bytes maximum`);
                    }
                    bs.logger.debug(`base64.length=${base64?.length} encoding=${encoding}`)
                    // create blueSky blob of image
                    bs.agent.uploadBlob(buffer, {encoding})
                        .then(upBlobResponse => {
                            const {data} = upBlobResponse;
                            const embed = {
                                $type: 'app.bsky.embed.images',
                                images: [ // can be an array up to 4 values
                                    {"alt": imageAltText, "image": data.blob}
                                ]
                            };
                            resolve(embed);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    async getMutes() {
        await this.login();
        const response = await this.api.app.bsky.graph.getMutes({/* limit: 50 is default */}, {});
        const {mutes} = response?.data || [];
        return mutes;
    }

    async safeMuteCandidateAuthor(postAuthor, reason, context) {
        const bs = this;
        const actorDid = didOfPostAuthor(postAuthor);
        const author = descriptionOfPostAuthor(postAuthor);
        await this.login();
        await this.api.app.bsky.graph.muteActor({"actor": actorDid})
            .then(response => bs.logger.info(`mute ${author} (${reason}) - data:${response.data} - success:${response.success}`, context))
            .catch(err => bs.logger.warn(`cant mute ${author} did:${actorDid} (${reason}) - err:${err.message}`, context));
    }

    async safeUnMuteMuted(mutedEntry, context) {
        const bs = this;
        const actorDid = didOfPostAuthor(mutedEntry);
        const author = descriptionOfPostAuthor(mutedEntry);
        await this.api.app.bsky.graph.unmuteActor({"actor": actorDid})
            .then(response => bs.logger.info(`un-mute ${author} - data:${response.data} - success:${response.success}`, context))
            .catch(err => bs.logger.warn(`cant un-mute ${author} did:${actorDid}- err:${err.message}`, context));
    }

// https://docs.bsky.app/docs/api/app-bsky-feed-get-post-thread
    async getParentPostOf(uri/* Reference (AT-URI) to post record.*/) {
        const response = await this.api.app.bsky.feed.getPostThread({uri}, {})
        const {data} = response;
        const parent = data?.thread?.parent;
        return parent && parent["$type"] === "app.bsky.feed.defs#threadViewPost" && isSet(parent["post"]) ?
            parent["post"] : null;
    }

    /*
    no usage for now

    // doc: https://docs.bsky.app/docs/api/app-bsky-actor-get-preferences
    async preferences() {
        await this.login();
        const response = await this.api.app.bsky.actor.getPreferences();
        this.logger.info(`response`, JSON.stringify(response, null, 2));
    }


    // doc : https://docs.bsky.app/docs/tutorials/viewing-feeds
    async timeline(cursor = "", limit = 5) {
        await this.login();
        const {data} = await this.agent.getTimeline({limit, cursor});
        const {feed: postsArray, cursor: nextPage} = data;
        this.logger.info(`postsArray`, JSON.stringify(postsArray, null, 2));
    }
    */

    async safeSleepMs(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}