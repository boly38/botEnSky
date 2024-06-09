import path from 'node:path';
import express from 'express';
import createError from 'http-errors';
import {
    cacheGetProjectBugsUrl,
    cacheGetProjectHomepage,
    cacheGetProjectMetadata,
    cacheGetVersion
} from "../lib/MemoryCache.js";
import {unauthorized} from "../lib/CommonApi.js";
import {generateErrorId} from "../lib/Common.js";
import {StatusCodes} from "http-status-codes";
import ApplicationConfig from "../config/ApplicationConfig.js";

const __dirname = path.resolve();
const wwwPath = path.join(__dirname, './src/www');

const BES_ISSUES = cacheGetProjectBugsUrl();

const HEALTH_ENDPOINT = '/health';
const UNAUTHORIZED_FRIENDLY = "Le milieu autorisé c'est un truc, vous y êtes pas vous hein !";// (c) Coluche
export default class ExpressServer {
    constructor(services) {
        const {
            config, loggerService, blueskyService,
            botService, newsService,
            auditLogsService, summaryService, inactivityDetector
        } = services;
        this.config = config;
        this.blueskyService = blueskyService;
        this.botService = botService;
        this.newsService = newsService;
        this.auditLogsService = auditLogsService;
        this.summaryService = summaryService;
        this.inactivityDetector = inactivityDetector;

        this.logger = loggerService.getLogger().child({label: 'ExpressServer'});

        this.port = config.port;
        this.tokenSimulation = config.bot.tokenSimulation;
        this.tokenAction = config.bot.tokenAction;
        this.version = cacheGetVersion();
        this.logger.debug("build", this.version);
        this.sendAutditLogs = auditLogsService.notifyLogs.bind(auditLogsService);
    }

    async init() {
        const expressServer = this;
        expressServer.logger.debug("init()");
        expressServer.app = express();

        expressServer.app.use(express.static(path.join(wwwPath, './public')));
        expressServer.app.use(expressServer.handleActivityTic.bind(this));
        expressServer.app.set('views', path.join(wwwPath, './views'));
        expressServer.app.set('view engine', 'ejs');
        expressServer.app.get('/api/about', expressServer.aboutResponse.bind(this));
        expressServer.app.get('/api/hook', expressServer.hookResponse.bind(this));
        expressServer.app.get(HEALTH_ENDPOINT, (req, res) => res.status(200));
        expressServer.app.get('/*', expressServer.webPagesResponse.bind(this));// default
        expressServer.app.use((req, res, next) => next(createError(404)));// catch 404 and forward to error handler
        expressServer.app.use(expressServer.errorHandlerMiddleware.bind(this));// error handler

        // build initial cache
        await this.summaryService.cacheGetWeekSummary({})

        // register inactivity listener
        this.inactivityDetector.registerOnInactivityListener(
            async ()=>{await ApplicationConfig.sendAuditLogs();}
        )

        expressServer.listeningServer = await expressServer.app.listen(expressServer.port);
        expressServer.logger.info(`Bot ${expressServer.version} listening on ${expressServer.port} with health on ${HEALTH_ENDPOINT}`);
        return expressServer.listeningServer;
    }

    getRemoteAddress(request) {
        return request.headers['x-forwarded-for'] ?
            request.headers['x-forwarded-for']
            : request.connection?.remoteAddress
            || "???";
    }

    handleActivityTic(req, res, next) {
        this.inactivityDetector.activityTic();
        next();
    }

    aboutResponse(req, res) {
        const {version} = this;
        res.json({version});
    }

    /**
     * trigger bot action
     * @param req
     * @param res cron job minimal response payload
     * @returns {Promise<void>}
     */
    async hookResponse(req, res) {
        const expressServer = this;
        try {
            let remoteAddress = expressServer.getRemoteAddress(req);
            let apiToken = req.get('API-TOKEN');
            let pluginName = req.get('PLUGIN-NAME');
            let doSimulate = expressServer.tokenSimulation && apiToken === expressServer.tokenSimulation;
            expressServer.context = {remoteAddress, pluginName, doSimulate};
            let doAction = !doSimulate && expressServer.tokenAction && apiToken === expressServer.tokenAction;
            if ("simulateError" === pluginName) {
                throw new Error("oops");
            }
            if (doSimulate || doAction) {
                await expressServer.botService.process(remoteAddress, doSimulate, pluginName);
                res.status(200).json({success: true});
            } else {
                this.logger.debug(StatusCodes.UNAUTHORIZED, JSON.stringify({code: 401, doSimulate, doAction}));
                unauthorized(res, UNAUTHORIZED_FRIENDLY);
            }
        } catch (error) {
            if (error.status && error.message) {
                const {status, message} = error;
                res.status(status).json({success: false, message});
                return;
            }
            let errId = generateErrorId();
            // internal
            let errorInternalDetails = `Error id:${errId} msg:${error.message} stack:${error.stack}`;
            this.logger.error(errorInternalDetails);
            this.auditLogsService.createAuditLog(errorInternalDetails);
            // user
            let userErrorTxt = `Erreur inattendue, merci de la signaler sur ${BES_ISSUES} - ${errId}`;
            let userErrorHtml = `Erreur inattendue, merci de la signaler sur <a href="${BES_ISSUES}">les issues</a> (dans les 3 j) - ${errId}`;
            this.newsService.add(userErrorHtml);
            res.status(500).json({success: false, message: userErrorTxt});
        }
    }

    async webPagesResponse(req, res) {
        const {version, newsService, config, summaryService} = this;
        const projectHomepage = cacheGetProjectHomepage();
        const projectIssues = cacheGetProjectBugsUrl();
        const projectDiscussions = cacheGetProjectMetadata("projectDiscussions");
        const blueskyAccount = cacheGetProjectMetadata("blueskyAccount");
        const blueskyDisplayName = cacheGetProjectMetadata("blueskyDisplayName");
        const summary = await summaryService.cacheGetWeekSummary({});
        newsService.getNews()
            .then(news => {
                res.render('pages/index', {// page data
                    news, "tz": config.tz,
                    version, projectHomepage, projectIssues, projectDiscussions,
                    blueskyAccount, blueskyDisplayName,
                    summary
                });
            });
    }

    async errorHandlerMiddleware(err, req, res) {
        const {logger, context} = this;
        const url = req.url;
        const status = err.status || 500;
        try {
            const src_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const method = req.method;
            if (status === 404) {
                logger.info(`SEC ${err} - ip:${src_ip} - ${method} ${url} - ${status}`,
                    {...context, status, url, "security": true}
                );
            } else {
                logger.error(`${err} - ip:${src_ip} - ${method} ${url} - ${status}`, {...context, status, url});
            }
        } catch (e) {
            logger.error(`errorHandlerMiddleware unexpected error: ${e.message}`, {...context, status, url});
        }
        res.status(status).send();
    }

}