import console from "node:console";
import process from "node:process";
import {ContainerBuilder} from 'node-dependency-injection';
import {nowHuman} from "../lib/Common.js";
import ApplicationProperties from './ApplicationProperties.js';
import LogtailService from "../servicesExternal/LogtailService.js";
import PlantnetApiService from "../servicesExternal/PlantnetApiService.js";
import BlueSkyService from "../servicesExternal/BlueSkyService.js";
import DiscordSendService from "../servicesExternal/DiscordSendService.js";
import ExpressServer from '../services/ExpressServer.js';
import BotService from "../services/BotService.js";
import NewsService from "../services/NewsService.js";
import LoggerService from "../services/LoggerService.js";
import AuditLogsService from "../services/AuditLogsService.js";
import PlantnetCommonService from "../services/PlantnetCommonService.js";
import SummaryService from "../services/SummaryService.js";
import Plantnet from "../plugins/Plantnet.js";
import AskPlantnet from "../plugins/AskPlantnet.js";
import UnMute from "../plugins/UnMute.js";
import Summary from "../plugins/Summary.js";
import InactivityDetector from "../services/InactivityDetector.js";
import GrBirdApiService from "../servicesExternal/GrBirdApiService.js";
import AviBaseService from "../servicesExternal/AviBaseService.js";
import BioClip from "../plugins/BioClip.js";
import PluginsCommonService from "../services/PluginsCommonService.js";
import AskBioclip from "../plugins/AskBioclip.js";
import BioclipCommonService from "../services/BioclipCommonService.js";

export default class ApplicationConfig {
    constructor() {
        console.log("build config...")
        this.container = new ContainerBuilder();
        this.constructServicesAndLogger();
        this.constructPlugins();
        this.constructBot();
    }

    constructServicesAndLogger() {
        const container = this.container;
        container.register('config', ApplicationProperties);
        container.register('loggerService', LoggerService)
            .addArgument(container.get('config'));

        // register logger
        this.logger = container.get('loggerService').getLogger().child({label: 'ApplicationConfig'}); // https://github.com/winstonjs/winston?tab=readme-ov-file#creating-child-loggers

        container.register('logtailService', LogtailService)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'));
        container.register('newsService', NewsService)
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('logtailService'));
        container.register('discordService', DiscordSendService)
            .addArgument(container.get('config'));
        container.register('auditLogsService', AuditLogsService)
            .addArgument(container.get('discordService'));

        container.register('blueskyService', BlueSkyService)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'));

        container.register('inactivityDetector', InactivityDetector)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'));

        container.register('pluginsCommonService', PluginsCommonService)
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('auditLogsService'))
            .addArgument(container.get('blueskyService'));

        container.register('plantnetCommonService', PlantnetCommonService)
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('blueskyService'))
            .addArgument(container.get('pluginsCommonService'));

        container.register('bioclipCommonService', BioclipCommonService)
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('blueskyService'))
            .addArgument(container.get('pluginsCommonService'));

        container.register('aviBaseService', AviBaseService)
            .addArgument(container.get('loggerService'));

        container.register('grBirdApiService', GrBirdApiService)
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('aviBaseService'));

        container.register('plantnetApiService', PlantnetApiService)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'));

        container.register('summaryService', SummaryService)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('blueskyService'));

    }

    constructPlugins() {
        const container = this.container;
        this.plugins = [];

        container.register('plantnet', Plantnet)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('blueskyService'))
            .addArgument(container.get('pluginsCommonService'))
            .addArgument(container.get('plantnetCommonService'))
            .addArgument(container.get('plantnetApiService'));
        this.plugins.push(container.get('plantnet'));

        container.register('askPlantnet', AskPlantnet)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('blueskyService'))
            .addArgument(container.get('pluginsCommonService'))
            .addArgument(container.get('plantnetCommonService'))
            .addArgument(container.get('plantnetApiService'));

        this.plugins.push(container.get('plantnet'));
        this.plugins.push(container.get('askPlantnet'));

        container.register('unmute', UnMute)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('blueskyService'));
        this.plugins.push(container.get('unmute'));

        container.register('summary', Summary)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('summaryService'))
            .addArgument(container.get('discordService'));
        this.plugins.push(container.get('summary'));

        container.register('bioclip', BioClip)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('pluginsCommonService'))
            .addArgument(container.get('bioclipCommonService'))
            .addArgument(container.get('grBirdApiService'));
        container.register('askBioclip', AskBioclip)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('blueskyService'))
            .addArgument(container.get('pluginsCommonService'))
            .addArgument(container.get('bioclipCommonService'))
            .addArgument(container.get('grBirdApiService'));
        this.plugins.push(container.get('bioclip'));
        this.plugins.push(container.get('askBioclip'));
    }

    constructBot() {
        const container = this.container;

        container.register('botService', BotService)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('auditLogsService'))
            .addArgument(container.get('newsService'))
            .addArgument(this.plugins)
        ;
    }

    get(beanName) {
        return this.container.get(beanName);
    }

    async initExpressServer() {
        const {container} = this;
        let inactivityDetector = container.get('inactivityDetector');
        ApplicationConfig.inactivityDetector = inactivityDetector;

        container
            .register('expressServer', ExpressServer)
            .addArgument({
                config: container.get('config'),
                loggerService: container.get('loggerService'),
                botService: container.get('botService'),
                blueskyService: container.get('blueskyService'),
                newsService: container.get('newsService'),
                auditLogsService: container.get('auditLogsService'),
                summaryService: container.get('summaryService'),
                inactivityDetector: inactivityDetector
            });
        const expressServer = container.get('expressServer');
        ApplicationConfig.listeningServer = await expressServer.init();
        return ApplicationConfig.listeningServer;
    }

    static async shutdown() {
        if (ApplicationConfig.inactivityDetector) {
            await ApplicationConfig.inactivityDetector.shutdown();
        }
        if (ApplicationConfig.listeningServer !== undefined) {
            await ApplicationConfig.listeningServer.close();
        }
    }
}


ApplicationConfig.singleton = null;
ApplicationConfig.getInstance = function getInstance() {
    if (ApplicationConfig.singleton === null) {
        ApplicationConfig.singleton = new ApplicationConfig();
    }
    return ApplicationConfig.singleton;
};
ApplicationConfig.sendAuditLogs = async () => {
    await ApplicationConfig.getInstance().get("auditLogsService").notifyLogs();
}
ApplicationConfig.removeSessions = async () => {
    await ApplicationConfig.getInstance().get("blueskyService").clearLogin();
}
ApplicationConfig.startServerMode = async () => {
    // https://nodejs.org/api/process.html#process_process_kill_pid_signal
    process.on('exit', () => console.log(`exit les pointes sèches`));
    process.on('SIGINT', () => ApplicationConfig.stopServerMode("SIGINT"));
    // render.com sequence of events : https://docs.render.com/deploys#sequence-of-events
    process.on('SIGTERM', () => ApplicationConfig.stopServerMode("SIGTERM"));

    // adding handler for SIGKILL produces  Error: uv_signal_start EINVAL issue
    // - https://stackoverflow.com/questions/16311347/node-script-throws-uv-signal-start-einval
    // - https://github.com/nodejs/node-v0.x-archive/issues/6339
    // process.on('SIGKILL', () => ApplicationConfig.stopServerMode("SIGKILL"));
    return ApplicationConfig.getInstance().initExpressServer();
}
ApplicationConfig.stopServerMode = async (origin = "unknown") => {
    console.log(`${nowHuman()} stopServerMode (origin:${origin})`);
    await ApplicationConfig.shutdown();
};