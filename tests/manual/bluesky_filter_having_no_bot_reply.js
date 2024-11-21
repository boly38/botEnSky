import {BskyAgent} from '@atproto/api'

/****** lib ******/
const exitFailed = err => {
    console.error(`❌ ${err.message}`);
    process.exit(1);
}
const expectEnvVariableToBeSet = envKey => {
    let val = process.env[envKey];
    if (val === undefined) {
        console.log(`please provide a ${envKey}`);
        process.exit(1);
    }
    return val;
}

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

    async filterPostRepliesByAuthor(postUri, authorHandle) {
        // all reply via `getPostThread`
        const reply = await this.api.app.bsky.feed.getPostThread({ uri: postUri });
        const replies = reply?.data?.thread?.replies[0]?.replies;
        // DEBUG // console.log(JSON.stringify(replies,null,2))
        if (!replies || replies.length === 0) { // no reply at all
            return [];
        }
        // filter reply by author only
        return replies.filter(reply => reply.post.author.handle === authorHandle);
    }

}

/**
 * filter reply of a given post excluding a given author.
 */
try {
    // const authorHandle = 'boly38.bsky.social';
    const authorHandle = 'botensky.bsky.social'; // bot handle
    // SEARCH_QUERY=AskBioClip node.exe tests/manual/bluesky_search.js
    const postUri = 'at://did:plc:iy7q3r5p5jagqaznuudppucr/app.bsky.feed.post/3lbgsz65s3224';

    const bluesky = new Bluesky();
    console.log(`🧪 login`);
    await bluesky.login()
    console.log(`🧪 filter replies having author @${authorHandle}`);
    const replies = await bluesky.filterPostRepliesByAuthor(postUri, authorHandle);
    console.log(`🤖 result:\n${JSON.stringify(replies, null, 2)}`);
} catch (err) {
    exitFailed(err);
}
