export default class HealthCheck {
    constructor(config, loggerService, blueskyService, unsplashService,
                pluginsCommonService, grBirdApiService, logsService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'HealthCheck'});
        this.blueskyService = blueskyService;
        this.unsplashService = unsplashService;
        this.pluginsCommonService = pluginsCommonService;
        this.grBirdApiService = grBirdApiService;
        this.logsService = logsService;
        try {
            this.isAvailable = unsplashService.isReady();
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
        errorCount = await this.checkLogs(errorCount);
        errorCount = await this.checkBlueskySearch(errorCount);

        const sentence = pluginName + (errorCount > 0 ? `❌ done with ${errorCount} errors.` : "✅ done without issue.");
        return await pluginsCommonService.resultSimple(pluginName, context, sentence);
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

    reportSuccess(target, durationMs, successMsg) {
        this.logger.info(`🧪✅ healthCheck - ${target} (${durationMs} ms) ${successMsg}`);
    }

    reportError(target, durationMs, error) {
        this.logger.info(`🧪❌ healthCheck - ${target} (${durationMs} ms) error: ${error.message}`);
    }
}

