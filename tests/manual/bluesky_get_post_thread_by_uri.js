// https://gist.github.com/boly38/TODO
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

    async getPostThread(uri) {
        console.log(`getPostThread ${uri}`);
        const response = await this.api.app.bsky.feed.getPostThread({uri}, {})
        const {data} = response;
        const thread = data?.thread
        return thread
    }

}

/**
 * search thread using uri from env, or argv
 * example: node.exe tests/manual/bluesky_get_post_thread_by_uri.js "at://did:plc:iy7q3r5p5jagqaznuudppucr/app.bsky.feed.post/3ktxkrxw6ls2x"
 */
try {
    const bluesky = new Bluesky();
    console.log(`🧪🧪 login`);

    const uri = process.env["URI"] || process.argv[2] || undefined;
    if (uri === undefined) {
        console.log(`please provide an uri`);
        process.exit(1);
    }
    await bluesky.login()
    const thread = await bluesky.getPostThread(uri);
    console.log(`thread:\n${JSON.stringify(thread, null, 2)}`);
} catch (err) {
    exitFailed(err);
}