import {BskyAgent, RichText} from '@atproto/api'
import {descriptionOfPostAuthor, didOfPostAuthor, postLinkOf, postsFilterSearchResults} from "../domain/post.js";
import {getEncodingBufferAndBase64FromUri, isSet, nowISO8601, nowMinusHoursUTCISO} from "../lib/Common.js";
import InternalServerErrorException from "../exceptions/ServerInternalErrorException.js";

const BLUESKY_POST_LENGTH_MAX = 300;// https://github.com/bluesky-social/bsky-docs/issues/162

export default class BlueSkyService {
    constructor(config, loggerService) {
        this.config = config;
        this.logger = loggerService.getLogger().child({label: 'BlueSkyService'});
        const {identifier, password, service} = config.bluesky
        this.agent = new BskyAgent({service})
        this.api = this.agent.api;// inspired from https://github.com/skyware-js/bot/blob/main/src/bot/Bot.ts#L324
        this.agentConfig = {identifier, password};
        this.profile = null;
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
        const {
            searchQuery = "boly38",
            limit = 20,
            sort = "latest",// recent first
            hasImages = false,// does post include embed image
            hasNoReply = false,// does post has 0 reply
            isNotMuted = true,// is post muted by bot
            maxHoursOld = 1// restrict search time window "since" limit
        } = options;
        const since = isSet(maxHoursOld) ? nowMinusHoursUTCISO(maxHoursOld) : null;
        await this.login();
        let params = {q: searchQuery, sort, limit};
        if (isSet(since)) {
            params["since"] = since;
            params["until"] = nowMinusHoursUTCISO(0);
        }
        this.logger.info(`searchPosts ${JSON.stringify(params)}`);
        const response = await this.api.app.bsky.feed.searchPosts(params, {});
        const posts = postsFilterSearchResults(response.data.posts, hasImages, hasNoReply, isNotMuted);
        this.logger.debug(`posts`, JSON.stringify(posts, null, 2));
        return posts;
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
}