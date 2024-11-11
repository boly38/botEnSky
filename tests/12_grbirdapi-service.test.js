import {describe, it} from "mocha";
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {_expectNoError, initEnv, testLogger} from "./libTest.js";
import {expect} from "chai";

const BAD_SCORE_JSON_RESULT = {"result": "BAD_SCORE"};

initEnv();
const appConfig = ApplicationConfig.getInstance();
let service = appConfig.get('grBirdApiService');
const testPlan = {
    predictBird: true
}

describe("🧪🧪 12 - grBirdApiService\n", () => {

    it("predict bird image url - BAD SCORE", done => {
        if (!testPlan.predictBird) {
            this.skip();
            return;
        }
        const imageUrl = "https://farm2.staticflickr.com/1595/26597148572_73514207cb_c.jpg";
        service.birdIdentify({imageUrl})
            .then(result => {
                testLogger.debug(`result : ${JSON.stringify(result)}`);
                expect(result).to.be.eql(BAD_SCORE_JSON_RESULT);
                done();
            })
            .catch(_expectNoError);
    }).timeout(15 * 1000);

    it("predict bird image url - GOOD SCORE", done => {
        if (!testPlan.predictBird) {
            this.skip();
            return;
        }
        const imageUrl = "https://www.thesprucepets.com/thmb/r23RBk0t4DC9UHp2pTzuXLz7Jj4=/3600x0/filters:no_upscale():strip_icc()/popular-small-bird-species-390926-hero-d3d0af7bb6ed4947b0c3c5afb4784456.jpg";
        service.birdIdentify({imageUrl})
            .then(result => {
                testLogger.debug(`result : ${JSON.stringify(result)}`);
                done();
            })
            .catch(_expectNoError);
    }).timeout(15 * 1000);

});
