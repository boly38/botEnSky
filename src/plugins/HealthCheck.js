import https from 'https';
import {tryToConnectToSocketWithRetry} from "../lib/NetworkUtil.js";

export default class HealthCheck {
    constructor(config, loggerService, blueskyService, plantnetApiService, pluginsCommonService, logsService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'HealthCheck'});
        this.blueskyService = blueskyService;
        this.plantnetApiService = plantnetApiService;
        this.pluginsCommonService = pluginsCommonService;
        this.logsService = logsService;
        this.plantnetHost = config.plantnet?.plantnetHost;
        try {
            this.isAvailable = plantnetApiService.isReady();
            this.logger.info((this.isAvailable ? "available" : "not available"));
        } catch (exception) {
            this.pluginsCommonService.logError("init", exception);
        }
    }

    getName() {
        return "HealthCheck";
    }

    getPluginTags() {
        return ["#BeSHealthCheck"].join(' ');
    }

    isReady() {
        return this.isAvailable;
    }

    async process(config) {
        const pluginName = this.getName();
        const {doSimulate, context} = config;
        const {logger, pluginsCommonService} = this;
        logger.info(`healthCheck - doSimulate:${doSimulate} - context:${JSON.stringify(context)}`);
        let errorCount = 0;

        /***************************** Checks *******************************************************/
        errorCount = await this.checkExternalIp(errorCount);
        errorCount = await this.checkLogs(errorCount);
        errorCount = await this.checkBlueskySearch(errorCount);
        errorCount = await this.checkPlantNetID(config, errorCount);
        if (this.plantnetHost) {
            errorCount = await this.checkPlantNetPort(errorCount, this.plantnetHost);
        }

        const sentence = pluginName + (errorCount > 0 ? `❌ done with ${errorCount} errors.` : "✅ done without issue.");
        return await pluginsCommonService.resultSimple(pluginName, context, sentence);
    }

    async checkExternalIp(errorCount) {
        const {logger} = this;
        try {
            const response = await new Promise((resolve, reject) => {
                https.get('https://api.ipify.org?format=json', (resp) => {
                    let data = '';
                    resp.on('data', (chunk) => data += chunk);
                    resp.on('end', () => resolve(data));
                }).on('error', reject);
            });
            const ip = JSON.parse(response).ip;
            logger.info(`External IP: ${ip}`);
        } catch (error) {
            errorCount++;
            logger.error(`Failed to get external IP: ${error.message}`);
        }
        return errorCount;
    }

    async checkLogs(errorCount) {
        const {logsService} = this;
        const start = Date.now();
        const target = "logsService.getRecentNews";
        try {
            const newsPost = await logsService.getRecentNews();
            const newsPostCount = Object.keys(newsPost?.data)?.length;
            this.reportSuccess(target, Date.now() - start, `${newsPost.from}..${newsPost.to} found ${newsPostCount} posts`);
        } catch (error) {
            errorCount++;
            this.reportError(target, Date.now() - start, error)
        }
        return errorCount;
    }

    async checkBlueskySearch(errorCount) {
        const {blueskyService} = this;
        const start = Date.now();
        const target = "blueskyService.searchPosts";
        try {
            const botPosts = await blueskyService.searchPosts({
                searchQuery: "from:botensky.bsky.social",
                "hasImages": false,
                "hasNoReply": false,
                "isNotMuted": false,
                "maxHoursOld": 7 * 24,// now-7d ... now
                "limit": 100,
                "exclusions": []
            });
            this.reportSuccess(target, Date.now() - start, `found ${botPosts.length} posts`);
        } catch (error) {
            errorCount++;
            this.reportError(target, Date.now() - start, error)
        }
        return errorCount;
    }

    async checkPlantNetID(config, errorCount) {
        const start = Date.now();
        const target = "plantnetApiService.plantnetIdentify";
        try {
            const {doSimulate, context} = config;
            const imageUrl = "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:bjivtavjwicclemh6xsotprl/bafkreib6aziube7wpdu2c7dhbgdbeofilny2faornvbhj23n6w7g7nzege@jpeg"
            const {
                result,
                plantnetResult = null
            } = await this.plantnetApiService.plantnetIdentify({
                imageUrl, // candidatePhoto?.fullsize,
                "doSimulate": false,
                "doSimulateIdentify": doSimulate,
                "simulateIdentifyCase": 'GoodScoreImages',
                context
            });
            this.reportSuccess(target, Date.now() - start,
                `result : ${JSON.stringify({result, plantnetResult})}`);
        } catch (error) {
            errorCount++;
            this.reportError(target, Date.now() - start, error)
        }
        return errorCount;
    }

    async checkPlantNetPort(errorCount, plantnetHost) {
        const start = Date.now();
        const target = "checkPlantNetPort";
        const {logger} = this;
        const host = plantnetHost;
        const port = 443;
        const timeout = 3000;
        const maxRetries = 2;
        try {
            await tryToConnectToSocketWithRetry(timeout, port, host, maxRetries, logger);
            this.reportSuccess(target, Date.now() - start, `on ${host} > port ${port} is open `);
        } catch (error) {
            errorCount++;
            this.reportError(target, Date.now() - start, error)
        }
        return errorCount;
    }


    reportSuccess(target, durationMs, successMsg) {
        this.logger.info(`🧪✅ healthCheck - ${target} (${durationMs} ms) ${successMsg}`);
    }

    reportError(target, durationMs, error) {
        console.log(error.stack);
        this.logger.info(`🧪❌ healthCheck - ${target} (${durationMs} ms) error: ${error.message}`);
    }

}

