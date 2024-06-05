// https://gist.github.com/boly38/275d95f0da14d8d708a14df9e0bb7c4a
import process from "node:process";
import {BskyAgent} from '@atproto/api';

const {"BLUESKY_USERNAME": identifier, "BLUESKY_PASSWORD": password} = process.env;// creds from env

const agent = new BskyAgent({"service": "https://api.bsky.social"})
await agent.login({identifier, password});
const response = await agent.api.app.bsky.actor.getPreferences();
const {preferences} = response.data
console.log(`${identifier}'s preferences:\n` + JSON.stringify(preferences, null, 2));