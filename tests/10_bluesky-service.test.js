import {expect} from 'chai';
import {describe, it} from "mocha";
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {_expectNoError, initEnv, testLogger} from "./libTest.js";

initEnv();
const appConfig = ApplicationConfig.getInstance();
let service = appConfig.get('blueskyService');
const testPlan = {
    searchPost: true
}

describe("🧪🧪 10 - BlueSkyService\n", () => {

    it("search post", done => {
        if (!testPlan.searchPost) {
            this.skip();
            return;
        }
        const searchQuery = "boly38";
        service.searchPosts({
            searchQuery,
            limit: 5,
            sort: "latest",
            hasImages: false,
            hasNoReply: false,
            maxHoursOld: null // no default "since" filter
        })
            .then(posts => {
                testLogger.debug("searchPosts", JSON.stringify(posts));
                expect(posts.length).to.be.gte(2);
                testLogger.info(`oh, we have got ${posts[0].author.displayName} that interacts with ${searchQuery}`)
                expect(posts[0].record.$type).to.be.eql("app.bsky.feed.post");
                done();
            })
            .catch(_expectNoError);
    }).timeout(60 * 1000);

});
