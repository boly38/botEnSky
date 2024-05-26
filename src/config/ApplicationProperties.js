import {assumePropertyIsSet, getEnv, getEnvInt} from "../lib/Common.js";
import console from "node:console";

export default class ApplicationProperties {

    constructor() {
        this.buildCommonEnvironment();
        this.verifyProperties();
        console.log(` ☑  properties ${this.nodeEnv}`);
    }

    buildCommonEnvironment() {
        this.nodeEnv = getEnv("NODE_ENV", 'development');
        this.tz = getEnv("TZ", 'Europe/Paris');
        this.port = getEnvInt("PORT", 5000);
        this.isProd = this.nodeEnv === 'production';

        this.log = {
            logtailToken: getEnv("LOG_LOGTAIL_TOKEN", null),
            logtailApiV1: "https://logs.betterstack.com/api/v1",
            logtailApiToken: getEnv("LOGTAIL_API_TOKEN", null),
            logtailSourceId: getEnv("LOGTAIL_SOURCE_ID", null)
        }

        this.bot = {
            // tokenSimulation drives bluesky write (post/ reply) simulation
            tokenSimulation: getEnv("BOT_TOKEN_SIMULATION", false),
            tokenAction: getEnv("BOT_TOKEN_ACTION", false),
            engineMinIntervalMs: getEnvInt("BOT_ENGINE_MIN_INTERVAL_MS", 59000),
            // plantnetSimulate drives plantnet API call simulation
            plantnetSimulate: (getEnv("BOT_PLANTNET_SIMULATE", "true") === "true")
        };

        this.bluesky = {
            identifier: getEnv("BLUESKY_USERNAME"),
            password: getEnv("BLUESKY_PASSWORD"),
            service: getEnv("BLUESKY_SERVICE")
        }
        this.plantnet = {
            apiKey: getEnv("PLANTNET_API_PRIVATE_KEY")
        }
    }

    verifyProperties() {
        // logtail is not mandatory
        assumePropertyIsSet(this.bot, "bot");
        assumePropertyIsSet(this.bot.tokenSimulation, "bot.tokenSimulation - env:BOT_TOKEN_SIMULATION");
        assumePropertyIsSet(this.bot.engineMinIntervalMs, "bot.engineMinIntervalMs - env:BOT_ENGINE_MIN_INTERVAL_MS");
        assumePropertyIsSet(this.bluesky, "bluesky");
        assumePropertyIsSet(this.bluesky.identifier, "bluesky.identifier - env:BLUESKY_USERNAME");
        assumePropertyIsSet(this.bluesky.password, "bluesky.password - env:BLUESKY_PASSWORD");
        assumePropertyIsSet(this.bluesky.service, "bluesky.service - env:BLUESKY_SERVICE");
        if (this.isProd) {
            assumePropertyIsSet(this.bot.tokenAction, "bot.tokenAction - env:BOT_TOKEN_ACTION");
            assumePropertyIsSet(this.plantnet.apiKey, "plantnet.apiKey - env:PLANTNET_API_PRIVATE_KEY");
        }
    }
}
