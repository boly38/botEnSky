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

        container.register('blueskyService', BlueSkyService)
            .addArgument(container.get('config'))
            .addArgument(container.get('loggerService'));

        container.register('plantnetCommonService', PlantnetCommonService)
            .addArgument(container.get('loggerService'))
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
            .addArgument(container.get('newsService'))
            .addArgument(this.plugins)
        ;
    }

    get(beanName) {
        return this.container.get(beanName);
    }

    initExpressServer() {
        const {container, logger} = this;
        container
            .register('expressServer', ExpressServer)
            .addArgument({
                config: container.get('config'),
                loggerService: container.get('loggerService'),
                botService: container.get('botService'),
                blueskyService: container.get('blueskyService'),
                newsService: container.get('newsService')
            });

        const expressServer = container.get('expressServer');
        return new Promise((resolve, reject) => {
            ApplicationConfig.listeningServer = expressServer.init()
                .then(resolve)
                .catch(errInitServer => {
                    logger.error("Error, unable to init express server:" + errInitServer);
                    reject(new Error("Init failed"));
                });
        });
    }
}


ApplicationConfig.singleton = null;
ApplicationConfig.getInstance = function getInstance() {
    if (ApplicationConfig.singleton === null) {
        ApplicationConfig.singleton = new ApplicationConfig();
    }
    return ApplicationConfig.singleton;
};
ApplicationConfig.startServerMode = () => ApplicationConfig.getInstance().initExpressServer();
ApplicationConfig.stopServerMode = () => {
    if (ApplicationConfig.listeningServer !== undefined) {
        ApplicationConfig.listeningServer.close();
    }
};