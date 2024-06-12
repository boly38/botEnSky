import {expect} from 'chai';
import {before, describe, it} from "mocha";
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {_expectNoError, initEnv, testLogger} from "./libTest.js";
import {loadJsonResource} from "../src/lib/Common.js";
import {dataSimulationDirectory} from "../src/services/BotService.js";
import {postsFilterSearchResults} from "../src/domain/post.js";

initEnv();
const appConfig = ApplicationConfig.getInstance();
let service = appConfig.get('blueskyService');
const testPlan = {
    searchPost: true,
    filterPosts: true,
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

let posts = null;
let initialLength = null;
let fakeAskPost = null;
let fakeFlowerPost = null
let fakeFlowerMutedPost = null
let viewReplyDisabledPost = null;
describe("🧪🧪 11 - BlueSky Posts\n", () => {

    before(() => {
        if (!testPlan.filterPosts) {
            return;
        }
        fakeAskPost = loadJsonResource(`${dataSimulationDirectory}/blueskyPostFakeAskBot.json`);
        fakeFlowerPost = loadJsonResource(`${dataSimulationDirectory}/blueskyPostFakeFlower.json`);
        fakeFlowerMutedPost = loadJsonResource(`${dataSimulationDirectory}/blueskyPostFakeFlowerMuted.json`);
        viewReplyDisabledPost = loadJsonResource(`${dataSimulationDirectory}/blueSkyPostViewReplyDisabled.json`);
        posts = [fakeAskPost, fakeFlowerPost, fakeFlowerMutedPost, viewReplyDisabledPost];
        initialLength = posts.length;
    });

    it("must NOT filter posts response except replyDisabled", () => {
        if (!testPlan.filterPosts) {
            this.skip();
            return;
        }
        const noFilterResult = postsFilterSearchResults(posts, false, false, false);
        let assertAllFilterDisabled = 'having all filters disabled must not filter except view.replyDisabled=true post';
        expect(noFilterResult).to.be.a('array', assertAllFilterDisabled);
        expect(noFilterResult).to.have.lengthOf(initialLength - 1, assertAllFilterDisabled);
        expect(noFilterResult.every(element => element.cid !== viewReplyDisabledPost.cid), assertAllFilterDisabled).to.be.true;
    });

    it("must hasImages filter posts", () => {
        if (!testPlan.filterPosts) {
            this.skip();
            return;
        }
        const assertImageOnly = 'having hasImages filter must filter blueskyPostFakeAskBot';
        const filterImageOnly = postsFilterSearchResults(posts, true, false, false);
        expect(filterImageOnly).to.be.a('array', assertImageOnly);
        expect(filterImageOnly).to.have.lengthOf(initialLength - 2, assertImageOnly);
        expect(filterImageOnly.every(element => element.cid !== fakeAskPost.cid), assertImageOnly).to.be.true;
    })

    it("must hasNoReply filter posts", () => {
        if (!testPlan.filterPosts) {
            this.skip();
            return;
        }
        const assertNoReply = 'having hasNoReply filter must filter blueSkyPostViewReplyDisabled';
        const filterNoReplyOnly = postsFilterSearchResults(posts, false, true, false);
        expect(filterNoReplyOnly).to.be.a('array', assertNoReply);
        expect(filterNoReplyOnly).to.have.lengthOf(initialLength - 1, assertNoReply);
        expect(filterNoReplyOnly.every(element => element.cid !== viewReplyDisabledPost.cid), assertNoReply).to.be.true;
    })

    it("must isNotMuted filter posts", () => {
        if (!testPlan.filterPosts) {
            this.skip();
            return;
        }
        const assertNoNotMuted = 'having isNotMuted filter must filter fakeFlowerMutedPost';
        const filterNotMutedOnly = postsFilterSearchResults(posts, false, false, true);
        expect(filterNotMutedOnly).to.be.a('array', assertNoNotMuted);
        expect(filterNotMutedOnly).to.have.lengthOf(initialLength - 2, assertNoNotMuted);
        expect(filterNotMutedOnly.every(element => element.cid !== fakeFlowerMutedPost.cid), assertNoNotMuted).to.be.true;
    })

})
