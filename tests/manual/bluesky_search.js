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
        return response.data.posts
    }

}

/**
 * search using query from env, or argv or default
 * example: node.exe tests/manual/bluesky_search.js "very small flower from:rangedan.bsky.social"
 */
try {
    const bluesky = new Bluesky();
    console.log(`🧪🧪 login`);

    const searchQuery = process.env["SEARCH_QUERY"] || process.argv[2] || "@botensky.bsky.social";

    await bluesky.login()
    const posts = await bluesky.postSearch(searchQuery);
    const candidate = posts[0];
    console.log(`🧍 candidate:\n${JSON.stringify(candidate, null, 2)}`);
} catch (err) {
    exitFailed(err);
}