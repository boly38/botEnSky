/* jshint expr: true */                                                                // for to.be.empty
import {before, describe, it} from 'mocha';
import {expect} from 'chai';
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {_expectNoError, initEnv, testLogger} from "./libTest.js";

initEnv();
const appConfig = ApplicationConfig.getInstance();
const pluginConfigDoSimulate = {doSimulate: true};
let plugin;

// v2 tests example : https://github.com/PLhery/node-twitter-api-v2/blob/master/test/tweet.v2.test.ts
describe("🧪🧪 30 - Pl@ntNet plugin", function () {

    before(() => {
        console.info(`plantnet test :: before`);
        plugin = appConfig.get('plantnet');
    });

    it("simulate plantnet identification with good score and images", async () => {
        await verifyPlantnetProcessResult(pluginConfigDoSimulate,
            ": Pl@ntNet identifie (à 85.09%) Pancratium SIMULATINIUM");
    }).timeout(60 * 1000);

    it("simulate plantnet identification with good score no image", async () => {
        await verifyPlantnetProcessResult({...pluginConfigDoSimulate, simulateIdentifyCase: "GoodScoreNoImage"},
            ": Pl@ntNet identifie (à 82.23%) NoImagium SIMULATINIUM");
    }).timeout(60 * 1000);

    it("simulate plantnet identification with bad score", async () => {
        await verifyPlantnetProcessResult({...pluginConfigDoSimulate, simulateIdentifyCase: "BadScore"},
            "identification par Pl@ntNet n'a pas donné de résultat assez concluant");
    }).timeout(60 * 1000);

});

async function verifyPlantnetProcessResult(config, expectedResultText) {
    const result = await plugin.process(config).catch(err => {
        if (err.status === 202) {
            testLogger.debug("plugin.process : no result");
        } else {
            _expectNoError(err);
        }
    });

    if (result) {
        testLogger.debug("plugin.process", result);
        expect(result.html).not.to.be.empty;
        expect(result.text).not.to.be.empty;
        // testLogger.debug(result.text)
        expect(result.text, `expected: ${result.text}`).to.contains(expectedResultText);
    }
}
