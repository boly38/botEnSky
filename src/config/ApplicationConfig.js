import {ContainerBuilder} from 'node-dependency-injection';
import log4js from 'log4js';
import ApplicationProperties from './ApplicationProperties.js';
import ExpressServer from '../services/ExpressServer.js';
import BlueSkyService from "../services/BlueSkyService.js";
import Plantnet from "../plugins/Plantnet.js";
import PlantnetService from "../services/PlantnetService.js";
import BotService from "../services/BotService.js";
import NewsService from "../services/NewsService.js";

export default class ApplicationConfig {
    constructor() {
        this.logger = log4js.getLogger('ApplicationConfig');
        this.logger.level = "DEBUG"; // DEBUG will show api params
        this.container = new ContainerBuilder();
        this.constructServices();
        this.constructPlugins();
        this.constructBot();
    }

    constructServices() {
        const container = this.container;
        container.register('config', ApplicationProperties);
        container.register('newsService', NewsService);

        container.register('blueskyService', BlueSkyService)
            .addArgument(container.get('config'));

        container.register('plantnetService', PlantnetService)
            .addArgument( container.get('config') );
    }
    constructPlugins() {
        const container = this.container;
        this.plugins = [];

        container.register('plantnet', Plantnet)
            .addArgument( container.get('config') )
            .addArgument( container.get('blueskyService') )
            .addArgument( container.get('plantnetService') );
        this.plugins.push( container.get('plantnet') );
    }

    constructBot() {
        const container = this.container;

        container.register('botService', BotService)
            .addArgument( container.get('config') )
            .addArgument( container.get('newsService') )
            .addArgument( this.plugins )
        ;
    }

    get(beanName) {
        return this.container.get(beanName);
    }

    initExpressServer() {
        const { container }  = this;
        container
            .register('expressServer', ExpressServer)
            .addArgument({
                config: container.get('config'),
                botService: container.get('botService'),
                blueskyService: container.get('blueskyService'),
                newsService: container.get('newsService')
            });

        const expressServer = container.get('expressServer');
        return new Promise((resolve, reject) => {
            ApplicationConfig.listeningServer = expressServer.init()
                .then(resolve)
                .catch(errInitServer => {
                    this.logger.error("Error, unable to init express server:" + errInitServer);
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