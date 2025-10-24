import path from 'node:path';
import express from 'express';
import i18n from 'i18n';

import createError from 'http-errors';
import {
    cacheGetProjectBugsUrl,
    cacheGetProjectHomepage,
    cacheGetProjectMetadata,
    cacheGetVersion
} from "../lib/MemoryCache.js";
import {unauthorized} from "../lib/CommonApi.js";
import {generateErrorId, isSet} from "../lib/Common.js";
import {StatusCodes} from "http-status-codes";
import ApplicationConfig from "../config/ApplicationConfig.js";

const __dirname = path.resolve();
const wwwPath = path.join(__dirname, './src/www');

const BES_ISSUES = cacheGetProjectBugsUrl();
const HEALTH_ENDPOINT = '/health';

const UNAUTHORIZED_FRIENDLY = "Le milieu autorisé c'est un truc, vous y êtes pas vous hein !";// (c) Coluche
const DEBUG_NEWS = false;
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

        // doc: https://github.com/mashpie/i18n-node
        // as singleton // https://github.com/mashpie/i18n-node?tab=readme-ov-file#as-singleton
        i18n.configure({
            locales: ['fr', 'en'],
            directory: path.join(__dirname, 'src', 'locales'),
            defaultLocale: 'en',
            queryParameter: 'lang',// query parameter to switch locale (ie. /home?lang=ch) - defaults to NULL
            cookie: 'lang'
        });

        expressServer.app = express();

        expressServer.app.use(express.static(path.join(wwwPath, './public')));
        expressServer.app.use(expressServer.handleActivityTic.bind(this));
        expressServer.app.use(expressServer.i18n.bind(this));
        expressServer.app.set('views', path.join(wwwPath, './views'));
        expressServer.app.set('view engine', 'ejs');
        expressServer.app.get(HEALTH_ENDPOINT, expressServer.healthResponse.bind(this));
        expressServer.app.get('/api/about', expressServer.aboutResponse.bind(this));
        expressServer.app.get('/api/hook', expressServer.hookResponse.bind(this));

        // Catch-all pour le front-end (SPA)
        expressServer.app.get('*', expressServer.webPagesResponse.bind(this));

        // catch 404 and forward to error handler
        expressServer.app.use((req, res, next) => {
            // DEBUG //
            expressServer.logger.info("catch 404 req",req.path);
            next(createError(404));
        });

        expressServer.app.use(expressServer.errorHandlerMiddleware.bind(this));

        // build initial cache
        try {
            await this.summaryService.cacheGetWeekSummary({})
        } catch (summaryError) {
            this.logger.error(`Initial getWeekSummary Error msg:${summaryError.message} stack:${summaryError.stack}`);
        }

        // register inactivity listener
        this.inactivityDetector.registerOnInactivityListener(
            async () => {
                await ApplicationConfig.sendAuditLogs();
                await ApplicationConfig.removeSessions();
            }
        )
        expressServer.listeningServer = await expressServer.app.listen(expressServer.port);
        expressServer.logger.info(`✅🎧 Bot ${expressServer.version} listening on ${expressServer.port} with health on ${HEALTH_ENDPOINT}`);
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

    i18n(req, res, next) {
        i18n.init(req, res);
        return next();
    }

    healthResponse(req, res) {
        res.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString(),
        });
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
            const currentLocale = i18n.getLocale();
            const remoteAddress = expressServer.getRemoteAddress(req);
            const apiToken = req.get('API-TOKEN');
            const pluginName = req.get('PLUGIN-NAME');
            const doSimulate = expressServer.tokenSimulation && apiToken === expressServer.tokenSimulation;
            expressServer.context = {currentLocale, remoteAddress, pluginName, doSimulate};
            let doAction = !doSimulate && expressServer.tokenAction && apiToken === expressServer.tokenAction;
            if ("simulateError" === pluginName) {
                throw new Error("simulateError");
            }
            if (doSimulate || doAction) {
                await expressServer.botService.process(remoteAddress, doSimulate, pluginName);
                res.status(200).json({success: true});
            } else {
                this.logger.debug(StatusCodes.UNAUTHORIZED, JSON.stringify({code: 401, doSimulate, doAction}));
                unauthorized(res, UNAUTHORIZED_FRIENDLY);
            }
        } catch (error) {
            const {status, message, mustBeReported, text, html} = error;
            // DEBUG // console.log(JSON.stringify({status, message, mustBeReported, text, html}))
            const mustReportAsIncident = !isSet(mustBeReported) || mustBeReported;
            if (!mustReportAsIncident && isSet(text) && isSet(html)) {
                this.newsService.add(html);
                res.status(status).json({success: false, message});
                return;
            }
            let errId = generateErrorId();
            // internal
            let errorInternalDetails = `Error id:${errId} msg:${error.message} mustBeReported:${mustBeReported}`;
            this.logger.error(errorInternalDetails);
            this.auditLogsService.createAuditLog(errorInternalDetails);
            // user
            let unexpectedError = res.__('server.error.unexpected');
            let userErrorTxt = message;
            let userErrorHtml = message;
            if (mustReportAsIncident) {
                const pleaseReportIssue = res.__('server.pleaseReportIssue');
                const issueLink = res.__('server.issueLinkLabel');
                userErrorTxt = `${unexpectedError} ${status}, ${pleaseReportIssue} ${BES_ISSUES} - ${errId}`;
                userErrorHtml = `${unexpectedError} ${status}, ${pleaseReportIssue} <a href="${BES_ISSUES}">${issueLink}</a> - ${errId}`;
            }
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
                DEBUG_NEWS && console.log(`NEWS:${JSON.stringify(news)}`)
                // Example : {"from":"2024-08-24 13:26:40","to":"2024-08-27 13:26:40","data":{"2024-08-27":[{"dt":"09:04:14","message":"aucun candidat pour AskPlantnet"},{"dt":"09:01:45","message":"aucun candidat pour AskPlantnet"}]}}
                res.render('pages/index', {// page data
                    __: res.__,
                    // locale: res.currentLocale,
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