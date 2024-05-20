import {expect} from 'chai';
import {describe, it} from "mocha";
import log4js from 'log4js';
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {_expectNoError, initEnv} from "./libTest.js";

initEnv();
const appConfig = ApplicationConfig.getInstance();
const logger = log4js.getLogger('twitter-service.test');
logger.level = "INFO"; // DEBUG will show api params
let service = appConfig.get('blueskyService');
const testPlan = {
    searchPost: true,
}

describe("BlueSkyService", () => {

    it("search post", done => {
        if (!testPlan.searchPost) {
            this.skip();
            return;
        }
        service.searchPosts({
            searchQuery: "boly38",
            limit: 5,
            sort: "latest",
            hasImages: false,
            hasNoReply: false,
            maxHoursOld: null // no default "since" filter
        })
            .then(posts => {
                logger.debug("searchPosts", JSON.stringify(posts));
                expect(posts.length).to.be.gte(2);
                expect(posts[0].author.displayName).to.be.eql("Boly38");
                expect(posts[0].record.$type).to.be.eql("app.bsky.feed.post");
                done();
            })
            .catch(_expectNoError);
    }).timeout(60 * 1000);

});