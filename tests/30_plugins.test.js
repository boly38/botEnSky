/* jshint expr: true */                                                                // for to.be.empty
import {before, describe, it} from 'mocha';
import {expect} from 'chai';
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {_expectNoError, initEnv, testLogger} from "./libTest.js";

initEnv();
const appConfig = ApplicationConfig.getInstance();
const pluginConfigDoSimulate = {doSimulate: true, doSimulateSearch: true};
const defaultTags = "#BeSPlantnet #IndentificationDePlantes";
let plantnetPlugin;
let unmutePlugin;

// v2 tests example : https://github.com/PLhery/node-twitter-api-v2/blob/master/test/tweet.v2.test.ts
describe("🧪🧪 30 - Plugins\n", function () {

    before(() => {
        console.info(`plugin test :: before`);
        plantnetPlugin = appConfig.get('plantnet');
        unmutePlugin = appConfig.get('unmute');
    });

    it("Pl@ntNet plugin - simulate id. with good score and images", async () => {
        await verifyPluginProcessResult(plantnetPlugin, pluginConfigDoSimulate,
            [": Pl@ntNet identifie (à 85.09%) Pancratium SIMULATINIUM", defaultTags]);
    }).timeout(60 * 1000);

    it("Pl@ntNet plugin - simulate id. with good score no image", async () => {
        await verifyPluginProcessResult(plantnetPlugin, {...pluginConfigDoSimulate, simulateIdentifyCase: "GoodScoreNoImage"},
            [": Pl@ntNet identifie (à 82.23%) NoImagium SIMULATINIUM", defaultTags]);
    }).timeout(60 * 1000);

    it("Pl@ntNet plugin - simulate id. with bad score", async () => {
        await verifyPluginProcessResult(plantnetPlugin, {...pluginConfigDoSimulate, simulateIdentifyCase: "BadScore"},
            ["identification par Pl@ntNet n'a pas donné de résultat assez concluant"]);
    }).timeout(60 * 1000);

    it("UnMute plugin", async () => {
        await verifyPluginProcessResult(unmutePlugin, {},["Démasqué martijnrijk"]);
    }).timeout(60 * 1000);

});

async function verifyPluginProcessResult(plugin, config, expectedResultTexts) {
    const result = await plugin.process(config).catch(err => {
        if (err.status === 202) {
            testLogger.warn("plugin.process : no result - this use case should no more happens because bs search may be simulated");
        } else {
            _expectNoError(err);
        }
    });

    if (result) {
        testLogger.debug("plugin.process", result);
        expect(result.html).not.to.be.empty;
        expect(result.text).not.to.be.empty;
        // testLogger.debug(result.text)
        for (const text of expectedResultTexts) {
            expect(result.text, `expected: ${result.text}`).to.contains(text);
        }
    }
}
