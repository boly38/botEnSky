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

        this.cpuIsShared = this.isProd;// preserve hosting solution shared cpu / prevent app to be killed in resizeService
        if (this.cpuIsShared) {
            console.log(` ☑  cpu is shared 💊`);
        }

        this.discordWebhookUrl = getEnv("BOT_DISCORD_WEBHOOK_URL", null);
        this.inactivityDelayMin = getEnv("BOT_INACTIVITY_DELAY_MIN", 3);
        this.log = {
            betterstackDebug: getEnv("LOG_BETTERSTACK_DEBUG", false),
            // betterstack source token is used by logger (logtail client) to send new log
            betterstackSourceToken: getEnv("LOG_BETTERSTACK_SOURCE_TOKEN", null),

            /// betterstack api token is used by legacy API Bearer auth
            /// useless today ? // betterstackApiToken: getEnv("LOG_BETTERSTACK_API_TOKEN", null),

            // betterstack telemetry api endpoint is the latest API
            betterstackHttpRemotelyEndpoint: getEnv("LOG_BETTERSTACK_API_HTTP_REMOTELY_ENDPOINT", null),
            betterstackHttpUsername: getEnv("LOG_BETTERSTACK_API_HTTP_USERNAME", null),
            betterstackHttpPassword: getEnv("LOG_BETTERSTACK_API_HTTP_PASSWORD", null),
            betterstackTeamId: getEnv("LOG_BETTERSTACK_TEAM_ID", null),
            betterstackSourceTableName: getEnv("LOG_BETTERSTACK_SOURCE_TABLE_NAME", null)
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
            service: getEnv("BLUESKY_SERVICE"),
            exclusions : getEnv("BOT_BLUESKY_EXCLUSIONS", "")// list of author.handle to exclude from search result
        }

        // PLANTNET V2 API https://my-api.plantnet.org/v2/identify/all - https://my.plantnet.org/doc/api/identify
        // see also plantnet dedicated readme
        this.plantnet = {
            apiKey: getEnv("PLANTNET_API_PRIVATE_KEY"),
            plantnetHost: getEnv("PLANTNET_API_HOST", "my-api.plantnet.org"),
            plantnetIDApi: getEnv("PLANTNET_API_IDENTIFY_ALL", "https://my-api.plantnet.org/v2/identify/all")
        }
        this.unsplash = {
            access_key: getEnv("UNSPLASH_ACCESS_KEY")
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
