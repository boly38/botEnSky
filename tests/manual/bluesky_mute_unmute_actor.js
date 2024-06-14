/* eslint-disable no-unused-vars */
// https://gist.github.com/boly38/fb0a83e21bb73c212203c261b3cad287
import {BskyAgent} from '@atproto/api'
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js"
import timezone from "dayjs/plugin/timezone.js"

dayjs.extend(utc)
dayjs.extend(timezone)

/****** lib ******/
const exitFailed = err => {
    console.error(`❌ ${err.message}`);
    process.exit(1);
}
const nowMinusHoursUTCISO = (nbHours = 1) => dayjs.utc().subtract(nbHours, 'hour').toISOString()
const expectEnvVariableToBeSet = envKey => {
    let val = process.env[envKey];
    if (val === undefined) {
        console.log(`please provide a ${envKey}`);
        process.exit(1);
    }
    return val;
}
const retainOnePostByAuthor = (posts, author) => posts.filter(p => p?.author?.displayName === author)[0];
const assumeObjectOrLeave = (object, msg) => {
    if (object === undefined) {
        console.log(msg)
        process.exit(0)
    }
}
const authorDidFromPost = p => p?.author?.did;

class Bluesky {
    constructor() {
        this.identifier = expectEnvVariableToBeSet("BLUESKY_USERNAME");
        this.password = expectEnvVariableToBeSet("BLUESKY_PASSWORD");
        this.service = "https://api.bsky.social";
    }

    async login() {
        const {identifier, password, service} = this;
        const agent = new BskyAgent({service})
        await agent.login({identifier, password});
        this.api = agent.api;
    }

    async postSearch(author) {
        let params = {
            "q": author,
            "sort": "latest",
            "limit": 5,
//        "since": nowMinusHoursUTCISO(720),
//        "until": nowMinusHoursUTCISO(0)
        };
        console.log(`search ${JSON.stringify(params)}`);
        const response = await this.api.app.bsky.feed.searchPosts(params, {});
        return response.data.posts;
    }

    async showMutedActors() {
        const response = await this.api.app.bsky.graph.getMutes({limit: 10}, {});
        const {mutes} = response.data;
        if (mutes?.length < 1) {
            console.log("no muted actors");
            return;
        }
        console.log("muted actors : ", JSON.stringify(mutes, null, 2));
    }

    async muteActor(actorDid) {
        const response = await this.api.app.bsky.graph.muteActor({"actor": actorDid});
        console.log(`mute ${actorDid}:`, response.data, response.success);
    }

    async unmuteActor(actorDid) {
        const response = await this.api.app.bsky.graph.unmuteActor({"actor": actorDid});
        console.log(`unmute ${actorDid}:`, response.data, response.success);
    }
}

// ℹ️ to show muted actors via UI : https://bsky.app/moderation/muted-accounts

try {
    const author = expectEnvVariableToBeSet("BLUESKY_AUTHOR");
    const bluesky = new Bluesky();
    console.log(`🧪🧪 login`);

    await bluesky.login()
    const posts = await bluesky.postSearch(author);
    const candidate = retainOnePostByAuthor(posts, author);
    assumeObjectOrLeave(candidate, "no candidate dude.");
// DEBUG // console.log("post:" + JSON.stringify(candidate, null, 2))
    const authorDid = authorDidFromPost(candidate);
    console.log(`🧍 author ${author} Did:${authorDid}`);
    await bluesky.showMutedActors();
    console.log(`🧪🧪 mute ${author}`);
    await bluesky.muteActor(authorDid);
    await bluesky.showMutedActors();
    const postsWithMuted = await bluesky.postSearch(author);
    const candidateMuted = retainOnePostByAuthor(postsWithMuted, author);
    console.log("candidateMuted.author.viewer", JSON.stringify(candidateMuted.author.viewer, null, 2))
    console.log(`🧪🧪 unmute ${author}`);
    await bluesky.unmuteActor(authorDid);
    await bluesky.showMutedActors();
    const postsWithUnMuted = await bluesky.postSearch(author);
    const candidateUnMuted = retainOnePostByAuthor(postsWithUnMuted, author);
    console.log("candidateUnMuted.author.viewer", JSON.stringify(candidateUnMuted.author.viewer, null, 2))
} catch (err) {
    exitFailed(err);
}