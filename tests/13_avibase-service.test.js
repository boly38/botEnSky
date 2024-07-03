import {describe, it} from "mocha";
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {_expectNoError, initEnv, testLogger} from "./libTest.js";

initEnv();
const appConfig = ApplicationConfig.getInstance();
let service = appConfig.get('aviBaseService');
const testPlan = {
    getSpeciesLink: true
}

describe("🧪🧪 13 - aviBaseService\n", () => {

    it("avibase get species url", done => {
        if (!testPlan.getSpeciesLink) {
            this.skip();
            return;
        }
        // const species = "Alcedo gularis";
        const species = "Nymphicus hollandicus";
        service.getSpeciesLink(species)
            .then(result => {
                testLogger.debug(`result : ${JSON.stringify(result)}`);
                done();
            })
            .catch(_expectNoError);
    }).timeout(15 * 1000);

});
