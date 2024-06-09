import {pluginResolve} from "../services/BotService.js";

export default class Summary {
    constructor(config, loggerService, summaryService, discordService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'Summary'});
        this.summaryService = summaryService;
        this.discordService = discordService;
        this.isAvailable = true;
    }

    getName() {
        return "Summary";
    }

    isReady() {
        return this.isAvailable;
    }

    async process(config) {
        const analytics = await this.summaryService.cacheGetWeekSummary(config);
        // DEBUG // logger.info(`analytics :\n ${JSON.stringify(analytics, null, 2)}`, context);
        let text = `7 jours : posts: ${analytics.posts}, 'j'aime': ${analytics.likes}, réponses: ${analytics.replies}, re-post: ${analytics.reposts}`;
        text += `\n\nmeilleur score: ${analytics.bestScore} (${analytics.bestScorePosts.length} posts) - exemples : \n${analytics.bestScorePostsTxt}`;
        text += `\n\n+ de 'j'aime': ${analytics.bestLikes} (${analytics.bestLikesPosts.length} posts) - exemples : \n${analytics.bestLikesPostsTxt}`;

        let html = `<b>7 jours</b> : posts: ${analytics.posts}, likes: ${analytics.likes}, replies: ${analytics.replies}, reposts: ${analytics.reposts}`;
        html += `<br/><br/><b>Meilleur score</b> : ${analytics.bestScore} (${analytics.bestScorePosts?.length} posts) - exemples : <br/>${analytics.bestScorePostsHtml}`;
        html += `<br/><br/><b>+ de 'j'aime'</b> : ${analytics.bestLikes} (${analytics.bestLikesPosts?.length} posts) - exemples : <br/>${analytics.bestLikesPostsHtml}`;

        let markdown = `**7 jours** : posts: ${analytics.posts}, likes: ${analytics.likes}, replies: ${analytics.replies}, reposts: ${analytics.reposts}`;
        markdown += `\n\n**Meilleur score** : ${analytics.bestScore} (${analytics.bestScorePosts?.length} posts) - exemples : \n${analytics.bestScorePostsTxt}`;
        markdown += `\n\n**+ de 'j'aime'** : ${analytics.bestLikes} (${analytics.bestLikesPosts.length} posts) - exemples : \n${analytics.bestLikesPostsTxt}`;
        await this.discordService.sendMessage(markdown);

        return pluginResolve(text, html);
    }

}

