import {clearSummaryCache} from "./SummaryService.js";
import ServiceUnavailableException from "../exceptions/ServiceUnavailableException.js";
import TooManyRequestsException from "../exceptions/TooManyRequestsException.js";

export default class BotService {

    constructor(config, loggerService, auditLogsService, newsService, plugins) {
        this.logger = loggerService.getLogger().child({label: 'BotService'});
        this.intervalMs = config.bot.engineMinIntervalMs;
        this.auditLogsService = auditLogsService;
        this.newsService = newsService;
        this.plugins = plugins;
    }

    run() {
        this.logger.debug("run()");
        let bot = this;
        bot.defaultPlugin = bot.plugins && bot.plugins.length > 0 ? bot.plugins[0] : null;
        bot.logger.info(`started - minInterval:${this.intervalMs} - ${this.getPluginsDetails()}`);
    }

    getPNQuestions() {
        const engine = this;
        const pnPlugin = engine.getPluginByName("Plantnet");
        return pnPlugin?.getQuestions();
    }

    getPluginsDetails() {
        if (!Array.isArray(this.plugins) || this.plugins.length < 1) {
            return "(none)";
        }
        const pluginsNames = this.plugins.map(p => p.getName()).join(",");
        return `${this.plugins.length} plugin(s) : ${pluginsNames}`;
    }

    assumeProcessRateLimit(remoteAddress) {
        const bot = this;
        const nowMs = (new Date()).getTime();
        const allowedTs = bot.lastProcess + bot.intervalMs;
        const needToWaitSec = Math.floor((allowedTs - nowMs) / 1000);
        if (bot.lastProcess && allowedTs > nowMs) {
            bot.logger.info(`${remoteAddress} | need to wait ${needToWaitSec} sec`);
            throw new TooManyRequestsException();
        }
        bot.lastProcess = nowMs;
    }

    assumeBotReadyPlugin(pluginName, remoteAddress) {
        const bot = this;
        const plugin = bot.getPluginByName(pluginName);
        if (!plugin || !plugin.isReady()) {
            bot.logger.info(`${remoteAddress} | no plugin '${pluginName}' available`);
            throw new ServiceUnavailableException();
        }
        return plugin;
    }

    async process(remoteAddress, doSimulate, pluginName) {
        const bot = this;
        const context = {remoteAddress, pluginName};
        try {
            this.assumeProcessRateLimit(remoteAddress);
            const plugin = this.assumeBotReadyPlugin(pluginName, remoteAddress);
            bot.logger.info(`${(doSimulate ? "Simulation" : "Exécution")} du plugin - ${pluginName}`, context);
            const result = await plugin.process({"doSimulate": doSimulate, context});
            // DEBUG // bot.logger.info(`plugin result ${result.text}`, context);
            bot.newsService.add(result.html);
            if (result.post > 0) {
                clearSummaryCache();
            }
            return result;
        } catch (error) {
            if (error.status && error.message) {
                throw error;
            }
            bot.logger.warn(`plugin error: ${error.message}`, context);
            bot.auditLogsService.createAuditLog(`${error.message} ${JSON.stringify(context)}`);
            bot.newsService.add(error.html ? error.html : error.message);
            throw error;
        }
    }

    getState() {
        let engine = this;
        let pluginsNames = [];
        engine.plugins.forEach((p) => {
            pluginsNames.push(p.getName());
        });
        return "Plugins : " + pluginsNames.join(", ");
    }

    getPluginByName(pluginName) {
        let engine = this;
        if (!pluginName) {
            return engine.defaultPlugin;
        }
        let availablePlugins = engine.plugins.filter((p) => {
            return pluginName === p.getName();
        });
        return availablePlugins.length > 0 ? this.randomFromArray(availablePlugins) : false;
    }

    randomFromArray(arr) {
        if (!Array.isArray(arr) || arr.length <= 0) {
            return undefined;
        }
        return arr[Math.floor(Math.random() * arr.length)];
    }
}


export const pluginResolve = (text, html, status = 200, post = 0) => {
    return {text, html, status, post};
}
export const pluginReject = (text, html, status, shortResponseMessage, mustBeReported=false) => {
    return {text, html, status, message: shortResponseMessage, mustBeReported};
}

export const dataSimulationDirectory = "src/data/simulation"