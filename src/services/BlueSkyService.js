import {BskyAgent} from '@atproto/api'
import {filterWithEmbedImageView, fiterWithNoReply, fromBlueskyPosts, postLinkOf} from "../domain/post.js";
import {isSet, nowISO8601, nowMinusHoursUTCISO} from "../lib/Common.js";

export default class BlueSkyService {
    constructor(config, loggerService) {
        this.config = config;
        this.logger = loggerService.getLogger().child({ label: 'BlueSkyService' });
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
            sort = "latest",
            hasImages = false,
            hasNoReply = false,
            maxHoursOld = 1
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
                            if (hasImages === true) {
                                posts = posts.filter(filterWithEmbedImageView);
                            }
                            if (hasNoReply === true) {
                                posts = posts.filter(fiterWithNoReply);
                            }
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
     * @param post
     * @param text
     * @param doSimulate
     * @returns {Promise<unknown>}
     */
    replyTo(post, text, doSimulate) {
        const bs = this;
        return new Promise((resolve, reject) => {
            const { uri, cid } = post;
            const replyPost = {
                "reply": { "root": {uri,cid}, "parent": {uri,cid} },
                "$type": "app.bsky.feed.post",
                text,
                "createdAt": nowISO8601(), // ex. "2023-08-07T05:49:40.501974Z" OR new Date().toISOString()
            };

            if (doSimulate) {
                bs.logger.info(`SIMULATE REPLY TO ${postLinkOf(post)} : ${text}`);
                return resolve({ "uri":"simulated_reply_uri", "cid":"simulated_reploy_cid"});
            }
            bs.agent.post(replyPost)
                .then(postReplyResponse => {
                    bs.logger.info(`replyTo response : ${JSON.stringify(postReplyResponse)}`);
                    bs.logger.info(`replyTo ${postLinkOf(post)} : ${text}`);
                    resolve(postReplyResponse);
                })
                .catch(reject)
        });
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