import log4js from 'log4js';
import express from 'express';
import path from 'node:path';
import {
    cacheGetProjectBugsUrl,
    cacheGetProjectHomepage,
    cacheGetProjectMetadata,
    cacheGetVersion
} from "../lib/MemoryCache.js";
import {unauthorized} from "../lib/CommonApi.js";
import {generateErrorId} from "../lib/Common.js";
import {StatusCodes} from "http-status-codes";

const __dirname = path.resolve();
const wwwPath = path.join(__dirname, './src/www');

// const BotEngine = require('./BotEngine.js');

const DEBUG_SERVER = false;
const BES_ISSUES = cacheGetProjectBugsUrl();

export default class ExpressServer {
    constructor(services) {
        const {config, blueskyService, botService, newsService} = services;
        this.config = config;
        this.blueskyService = blueskyService;
        this.botService = botService;
        this.newsService = newsService;

        this.logger = log4js.getLogger('ExpressServer');
        this.logger.level = DEBUG_SERVER ? "DEBUG" : "INFO";

        this.port = config.port;
        this.tokenSimulation = config.bot.tokenSimulation;
        this.tokenAction = config.bot.tokenAction;
        this.version = cacheGetVersion();
        this.logger.debug("build", this.version);
    }

    init() {
        const expressServer = this;

        expressServer.logger.debug("init()");
        return new Promise(resolve => {
            expressServer.app = express();
            expressServer.app.use(express.static(path.join(wwwPath, './public')));
            expressServer.app.set('views', path.join(wwwPath, './views'));
            expressServer.app.set('view engine', 'ejs');
            expressServer.app.get('/api/about', expressServer.aboutResponse.bind(this));
            expressServer.app.get('/api/hook', expressServer.hookResponse.bind(this));
            expressServer.app.get('/*', expressServer.webPagesResponse.bind(this));// default
            expressServer.listeningServer = expressServer.app.listen(
                expressServer.port,
                () => expressServer.logger.info(
                    `Bot ${expressServer.version} listening on ${expressServer.port} - MY_TEST_VAR:${process.env.MY_TEST_VAR}`
                )
            );
            resolve(expressServer.listeningServer);
        });
    }

    getRemoteAddress(request) {
        return request.headers['x-forwarded-for'] ?
            request.headers['x-forwarded-for']
            : request.connection.remoteAddress;
    }

    aboutResponse(req, res) {
        const {version} = this;
        res.json({version});
    }

    async hookResponse(req, res) {
        const expressServer = this;
        try {
            let remoteAdd = expressServer.getRemoteAddress(req);
            let apiToken = req.get('API-TOKEN');
            let pluginName = req.get('PLUGIN-NAME');
            let doSimulate = expressServer.tokenSimulation && apiToken === expressServer.tokenSimulation;
            let doAction = !doSimulate && expressServer.tokenAction && apiToken === expressServer.tokenAction;
            if (!doSimulate && !doAction) {
                this.logger.debug(StatusCodes.UNAUTHORIZED, JSON.stringify({
                    code: 401,
                    doSimulate,
                    doAction
                }));
                unauthorized(res, "Le milieu autorisé c'est un truc, vous y êtes pas vous hein !", );
                return;
            }

            const pluginResult = await expressServer.botService.process(remoteAdd, doSimulate, pluginName)
                .catch(err => {
                    res.status(err.status).json({success: false, message: err});
                });
            if (pluginResult !== undefined) {
                res.status(200).json({success: true, message: pluginResult});
            }
        } catch (error) {
            let errId = generateErrorId();
            this.logger.error(errId, error);
            res.status(500).json({
                success: false,
                message: `Erreur inattendue, merci de la signaler sur ${BES_ISSUES} - ` + errId
            });
        }
    }

    webPagesResponse(req, res) {
        const {version, newsService} = this;
        const news = newsService.getNews();
        const projectHomepage = cacheGetProjectHomepage();
        const projectIssues = cacheGetProjectBugsUrl();
        const projectDiscussions = cacheGetProjectMetadata("projectDiscussions");
        const blueskyAccount = cacheGetProjectMetadata("blueskyAccount");
        const blueskyDisplayName = cacheGetProjectMetadata("blueskyDisplayName");
        res.render('pages/index', {// page data
            news,
            version, projectHomepage, projectIssues, projectDiscussions,
            blueskyAccount, blueskyDisplayName
        });
    }
}