import log4js from 'log4js';

const DEBUG_SERVICE = true;

export default class BotService {

    constructor(config, newsService, plugins) {
        this.logger = log4js.getLogger('BotService');
        this.logger.level = DEBUG_SERVICE ? "DEBUG" : "INFO";
        this.intervalMs = config.bot.engineMinIntervalMs;
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

    process(remoteAddress, doSimulate, pluginName) {
        const bot = this;
        return new Promise((resolve, reject) => {
            bot.logger.debug(`process(${remoteAddress}, doSimulate:${doSimulate}, ${pluginName})`);
            const nowMs = (new Date()).getTime();
            const allowedTs = bot.lastProcess + bot.intervalMs;
            const needToWaitSec = Math.floor((allowedTs - nowMs) / 1000);
            if (bot.lastProcess && allowedTs > nowMs) {
                bot.logger.info(remoteAddress + " | need to wait " + needToWaitSec + " sec");
                reject({"message": "Demande trop rapprochée, retentez plus tard", "status": 429});
                return;
            }
            bot.lastProcess = nowMs;
            const plugin = bot.getPluginByName(pluginName);
            if (!plugin || !plugin.isReady()) {
                bot.logger.info(remoteAddress + ` | no plugin '${pluginName}' available`);
                reject({"message": "je suis actuellement en maintenance, retentez plus tard", "status": 503});
                return;
            }
            bot.logger.info( `${remoteAddress} | process ${(doSimulate ? "SIMULATION" : "")} right now - ${pluginName}`);
            bot.newsService.add(`${(doSimulate ? "Simulation" : "Exécution")} du plugin - ${pluginName}`);
            plugin.process({"doSimulate": doSimulate})
                .then(result => {
                    bot.logger.info("plugin result " + result.text);
                    bot.newsService.add(result.html);
                    resolve(result);
                })
                .catch(err => {
                    bot.logger.warn("plugin response status:" + err.status + " msg:" + err.message);
                    bot.newsService.add(err.html ? err.html : err.message);
                    reject(err);
                });
        });
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