import {ContainerBuilder} from 'node-dependency-injection';
import ApplicationProperties from './ApplicationProperties.js';
import ExpressServer from '../services/ExpressServer.js';
import BlueSkyService from "../services/BlueSkyService.js";
import Plantnet from "../plugins/Plantnet.js";
import PlantnetApiService from "../services/PlantnetApiService.js";
import BotService from "../services/BotService.js";
import NewsService from "../services/NewsService.js";
import LoggerService from "../services/LoggerService.js";
import LogtailService from "../services/LogtailService.js";
import UnMute from "../plugins/UnMute.js";
import AskPlantnet from "../plugins/AskPlantnet.js";
import PlantnetCommonService from "../services/PlantnetCommonService.js";
import {nowHuman} from "../lib/Common.js";
import DiscordSendService from "../servicesExternal/DiscordSendService.js";
import AuditLogsService from "../services/AuditLogsService.js";

export default class ApplicationConfig {
    constructor() {
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

        container.register('plantnetCommonService', PlantnetCommonService)
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('auditLogsService'))
            .addArgument(container.get('blueskyService'));

        container.register('plantnetApiService', PlantnetApiService)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'));
    }

    constructPlugins() {
        const container = this.container;
        this.plugins = [];

        container.register('plantnet', Plantnet)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('blueskyService'))
            .addArgument(container.get('plantnetCommonService'))
            .addArgument(container.get('plantnetApiService'));
        this.plugins.push(container.get('plantnet'));

        container.register('askPlantnet', AskPlantnet)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('blueskyService'))
            .addArgument(container.get('plantnetCommonService'))
            .addArgument(container.get('plantnetApiService'));

        this.plugins.push(container.get('plantnet'));
        this.plugins.push(container.get('askPlantnet'));

        container.register('unmute', UnMute)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'))
            .addArgument(container.get('blueskyService'));
        this.plugins.push(container.get('unmute'));
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
        container
            .register('expressServer', ExpressServer)
            .addArgument({
                config: container.get('config'),
                loggerService: container.get('loggerService'),
                botService: container.get('botService'),
                blueskyService: container.get('blueskyService'),
                newsService: container.get('newsService'),
                auditLogsService: container.get('auditLogsService')
            });

        const expressServer = container.get('expressServer');
        ApplicationConfig.listeningServer = await expressServer.init();
        return ApplicationConfig.listeningServer;
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
    if (ApplicationConfig.listeningServer !== undefined) {
        ApplicationConfig.listeningServer.close();
    }
    await ApplicationConfig.sendAuditLogs();
};