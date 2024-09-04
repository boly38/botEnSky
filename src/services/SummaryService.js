import {cacheEvictKey, cacheGetTtlObject} from "../lib/MemoryCache.js";
import {htmlOfPosts, txtOfPosts} from "../domain/post.js";

export const SUMMARY_CACHE_KEY = "cache:summary";
export const ONE_DAY_SECOND = 60 * 60 * 24;

export default class SummaryService {
    constructor(config, loggerService, blueskyService) {
        this.config = config;
        this.logger = loggerService.getLogger().child({label: 'SummaryService'});
        this.blueskyService = blueskyService;
    }

    cacheGetWeekSummary(config) {
        return cacheGetTtlObject(SUMMARY_CACHE_KEY, ONE_DAY_SECOND, this.getWeekSummary.bind(this, config));
    }

    async getWeekSummary(options) {
        const {blueskyService, logger} = this;
        const {context = {}} = options;
        const botPosts = await blueskyService.searchPosts({
            searchQuery: "from:botensky.bsky.social",
            "hasImages": true,
            "maxHoursOld": 7 * 24,// now-7d ... now
            "limit": 100
        })
        logger.info(`Summary - ${botPosts?.length} post(s)`, context);
        const analytics = {
            posts: 0, likes: 0, replies: 0, reposts: 0,
            bestScore: 0, bestScorePosts: [],
            bestLikes: 0, bestLikesPosts: []
        };
        botPosts.forEach(p => {
            // DEBUG // logger.info(` - ${p.record.createdAt} - likes:${p.likeCount} replies:${p.replyCount}, reposts:${p.repostCount}`, context);
            analytics.posts++;
            analytics.likes += p.likeCount;
            analytics.replies += p.replyCount;
            analytics.reposts += p.repostCount;
            const postScore = p.likeCount * 2 + p.replyCount * 3 + p.repostCount * 4;
            if (postScore === analytics.bestScore) {
                analytics.bestScorePosts.push(p);
            } else if (postScore > analytics.bestScore) {
                analytics.bestScorePosts = [p];
                analytics.bestScore = postScore;
            }
            if (p.likeCount === analytics.bestLikes) {
                analytics.bestLikesPosts.push(p);
            } else if (p.likeCount > analytics.bestLikes) {
                analytics.bestLikesPosts = [p];
                analytics.bestLikes = p.likeCount;
            }
        });
        analytics.bestScorePostsHtml = htmlOfPosts(analytics.bestScorePosts, 2);
        analytics.bestLikesPostsHtml = htmlOfPosts(analytics.bestLikesPosts, 2);
        analytics.bestScorePostsTxt = txtOfPosts(analytics.bestScorePosts, 2);
        analytics.bestLikesPostsTxt = txtOfPosts(analytics.bestLikesPosts, 2);
        return analytics;
    }
}

export const clearSummaryCache = () => cacheEvictKey(SUMMARY_CACHE_KEY);