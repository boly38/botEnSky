import {describe, it} from "mocha";
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {_expectNoError, initEnv, testLogger} from "./libTest.js";
import {expect} from "chai";

initEnv();
const appConfig = ApplicationConfig.getInstance();
let service = appConfig.get('aviBaseService');
const testPlan = {
    getSpeciesLink: true
}

describe("🧪🧪 13 - aviBaseService\n", () => {

    it("avibase get species url", async () => {
        if (!testPlan.getSpeciesLink) {
            this.skip();
            return;
        }
        const speciesArray = [
            "Alcedo gularis",
            "Ardea alba", // #76 - but was transient issue I think
            /*
            "Cardinalis cardinalis",
            "Dendrocopos major",
            "Myrmoborus leucophrys",
            "Nymphicus hollandicus",
             */
            "Hey !? what are you waiting for ? Christmas ?" // https://www.youtube.com/watch?v=vifwar7jxcQ
        ];
        for (const species of speciesArray) {
            const result = await service.getSpeciesLink(species).catch(_expectNoError);
            testLogger.info(`species "${species}" result : ${JSON.stringify(result)}`);
            if (result !== null) {
                expect(result).to.be.a('string').and.satisfy(rez => rez.startsWith('Avibase flickr\nhttps://is.gd/'));
            }
        }
    }).timeout(30 * 1000);

});
