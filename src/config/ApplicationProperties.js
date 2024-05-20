import {assumePropertyIsSet, getEnv, getEnvInt} from "../lib/Common.js";
import log4js from "log4js";

export default class ApplicationProperties {

    constructor() {
        this.logger = log4js.getLogger('ApplicationProperties');
        this.logger.level = "INFO"; // DEBUG will show api params
        this.buildCommonEnvironment();
        this.verifyProperties();
        this.logger.info(`☑ properties ${this.nodeEnv}`);
    }

    buildCommonEnvironment() {
        this.nodeEnv = getEnv("NODE_ENV", 'development');
        this.port = getEnvInt("PORT", 5000);
        this.isProd = this.nodeEnv === 'production';
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
        assumePropertyIsSet(this.bot, "bot");
        assumePropertyIsSet(this.bot.engineMinIntervalMs, "bot.engineMinIntervalMs - env:BOT_ENGINE_MIN_INTERVAL_MS");
        assumePropertyIsSet(this.bluesky, "bluesky");
        assumePropertyIsSet(this.bluesky.identifier, "bluesky.identifier - env:BLUESKY_USERNAME");
        assumePropertyIsSet(this.bluesky.password, "bluesky.password - env:BLUESKY_PASSWORD");
        assumePropertyIsSet(this.bluesky.service, "bluesky.service - env:BLUESKY_SERVICE");
        if (this.isProd) {
            assumePropertyIsSet(this.plantnet.apiKey, "plantnet.apiKey - env:PLANTNET_API_PRIVATE_KEY");
        }
    }
}
