import express from 'express';
import path from 'node:path';
import {
    cacheGetProjectBugsUrl,
    cacheGetProjectHomepage,
    cacheGetProjectMetadata,
    cacheGetVersion
} from "../lib/MemoryCache.js";
import {unauthorized} from "../lib/CommonApi.js";
import {generateErrorId, isSet} from "../lib/Common.js";
import {StatusCodes} from "http-status-codes";

const __dirname = path.resolve();
const wwwPath = path.join(__dirname, './src/www');

const BES_ISSUES = cacheGetProjectBugsUrl();

const UNAUTHORIZED_FRIENDLY = "Le milieu autorisé c'est un truc, vous y êtes pas vous hein !";// (c) Coluche
export default class ExpressServer {
    constructor(services) {
        const {config, loggerService, blueskyService, botService, newsService} = services;
        this.config = config;
        this.blueskyService = blueskyService;
        this.botService = botService;
        this.newsService = newsService;

        this.logger = loggerService.getLogger().child({label: 'ExpressServer'});

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
                    `Bot ${expressServer.version} listening on ${expressServer.port}`
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

    /**
     * trigger bot action
     * @param req
     * @param res cronjob limits the response payload (#9) and read only 64KB
     * @returns {Promise<void>}
     */
    async hookResponse(req, res) {
        const expressServer = this;
        try {
            let remoteAdd = expressServer.getRemoteAddress(req);
            let apiToken = req.get('API-TOKEN');
            let pluginName = req.get('PLUGIN-NAME');
            let doSimulate = expressServer.tokenSimulation && apiToken === expressServer.tokenSimulation;
            let doAction = !doSimulate && expressServer.tokenAction && apiToken === expressServer.tokenAction;
            if (doSimulate || doAction) {
                expressServer.botService.process(remoteAdd, doSimulate, pluginName)
                    .then(() => res.status(200).json({success: true}))
                    .catch(err => {
                        const status = isSet(err.status) ? err.status : 500;
                        res.status(status).json({success: false, status}); // do not include details in response
                    });
            } else {
                this.logger.debug(StatusCodes.UNAUTHORIZED, JSON.stringify({code: 401, doSimulate, doAction}));
                unauthorized(res, UNAUTHORIZED_FRIENDLY);
            }
        } catch (error) {
            let errId = generateErrorId();
            this.logger.error(errId, error);
            res.status(500).json({
                success: false,
                message: `Erreur inattendue, merci de la signaler sur ${BES_ISSUES} - ${errId}`
            });
        }
    }

    webPagesResponse(req, res) {
        const {version, newsService, config} = this;
        const projectHomepage = cacheGetProjectHomepage();
        const projectIssues = cacheGetProjectBugsUrl();
        const projectDiscussions = cacheGetProjectMetadata("projectDiscussions");
        const blueskyAccount = cacheGetProjectMetadata("blueskyAccount");
        const blueskyDisplayName = cacheGetProjectMetadata("blueskyDisplayName");
        newsService.getNews()
            .then(news => {
                res.render('pages/index', {// page data
                    news, "tz":config.tz,
                    version, projectHomepage, projectIssues, projectDiscussions,
                    blueskyAccount, blueskyDisplayName
                });
            });
    }
}