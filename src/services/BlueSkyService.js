import {BskyAgent, RichText} from '@atproto/api'
import {
    descriptionOfPostAuthor,
    didOfPostAuthor,
    filterWithEmbedImageView,
    fiterWithNoReply,
    fiterWithNotMuted,
    fromBlueskyPosts,
    postLinkOf
} from "../domain/post.js";
import {getEncodingBufferAndBase64FromUri, isSet, nowISO8601, nowMinusHoursUTCISO} from "../lib/Common.js";

export default class BlueSkyService {
    constructor(config, loggerService) {
        this.config = config;
        this.logger = loggerService.getLogger().child({label: 'BlueSkyService'});
        const {identifier, password, service} = config.bluesky
        this.agent = new BskyAgent({service})
        this.api = this.agent.api;// inspired from https://github.com/skyware-js/bot/blob/main/src/bot/Bot.ts#L324
        this.agentConfig = {identifier, password};
    }

    login() {
        const bs = this;
        const {identifier, service} = this.config.bluesky
        this.logger.info(`login ${identifier}@${service}`);
        return new Promise((resolve, reject) => {
            bs.agent.login(this.agentConfig)
                .then(loginResponse => {
                    bs.logger.debug("loginResponse", loginResponse);
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
            limit = 5,
            sort = "latest",// recent first
            hasImages = false,// does post include embed image
            hasNoReply = false,// does post has 0 reply
            isNotMuted = true,// is post muted by bot
            maxHoursOld = 1// restrict search time window "since" limit
        } = options;
        return new Promise((resolve, reject) => {
            const since = isSet(maxHoursOld) ? nowMinusHoursUTCISO(maxHoursOld) : null;
            this.login()
                .then(() => {
                    let params = {q: searchQuery, sort, limit};
                    if (isSet(since)) {
                        params["since"] = since;
                    }
                    this.logger.info(`searchPosts ${JSON.stringify(params)}`);
                    this.api.app.bsky.feed.searchPosts(params, {})
                        .then(response => {
                            this.logger.info(`response`, JSON.stringify(response, null, 2));
                            let posts = fromBlueskyPosts(response.data.posts);
                            posts = hasImages ? posts.filter(filterWithEmbedImageView) : posts;
                            posts = hasNoReply ? posts.filter(fiterWithNoReply) : posts;
                            posts = isNotMuted ? posts.filter(fiterWithNotMuted) : posts;
                            this.logger.debug(`posts`, JSON.stringify(posts, null, 2));
                            resolve(posts);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
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
    replyTo(post, text, doSimulate, embed = null) {
        const bs = this;
        return new Promise(async (resolve, reject) => {
            const {uri, cid} = post;

            //~ rich format
            const rt = new RichText({text})
            try {
                await rt.detectFacets(bs.agent) // automatically detects mentions and links
            } catch (err) {
                bs.logger.error(`detectFacets error ${err.message}`);
            }
            const replyPost = {
                "reply": {"root": {uri, cid}, "parent": {uri, cid}},
                "$type": "app.bsky.feed.post",
                text: rt.text,
                facets: rt.facets,
                "createdAt": nowISO8601(), // ex. "2023-08-07T05:49:40.501974Z" OR new Date().toISOString()
            };
            if (embed !== null) {
                replyPost["embed"] = embed;
            }

            if (doSimulate) {
                const embedDesc = embed !== null ? `\n[${embed["$type"]}|alt:${embed?.images[0]?.alt}]` : '';
                bs.logger.info(`SIMULATE REPLY TO ${postLinkOf(post)} : ${text}${embedDesc}`);
                return resolve({"uri": "simulated_reply_uri", "cid": "simulated_reply_cid"});
            }
            bs.logger.debug("POST SENT:\n" + JSON.stringify(replyPost, null, 2))
            bs.agent.post(replyPost)
                .then(postReplyResponse => {
                    bs.logger.info(`replyTo response : ${JSON.stringify(postReplyResponse)}`);
                    bs.logger.info(`replyTo ${postLinkOf(post)} : ${text}`);
                    resolve(postReplyResponse);
                })
                .catch(reject)
        });
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