/* jshint expr: true */  // for to.be.empty
/* eslint-disable mocha/max-top-level-suites */
import {before, describe, it} from 'mocha';
import {expect} from 'chai';
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {_expectNoError, initEnv, testLogger} from "./libTest.js";

initEnv();
const appConfig = ApplicationConfig.getInstance();
const pluginConfigDoSimulate = {doSimulate: true, doSimulateSearch: true};
const plantnetPluginDefaultTag = "#BeSPlantnet #IndentificationDePlantes";
const plantnetAskPluginDefaultTag = "#BeSAskPlantnet #IndentificationDePlantes";
let plantnetPlugin;
let askPlantnetPlugin;
let unmutePlugin;

// v2 tests example : https://github.com/PLhery/node-twitter-api-v2/blob/master/test/tweet.v2.test.ts
describe("🧪🧩 30 - Pl@ntNet Plugin\n", function () {

    before(() => {
        plantnetPlugin = appConfig.get('plantnet');
    });

    it("Pl@ntNet plugin - id. OK images", async () => {
        await verifyPluginProcessResult(plantnetPlugin, pluginConfigDoSimulate,
            [": Pl@ntNet identifie (à 85.09%) Pancratium SIMULATINIUM", plantnetPluginDefaultTag]);
    }).timeout(60 * 1000);

    it("Pl@ntNet plugin - id. OK no image", async () => {
        await verifyPluginProcessResult(plantnetPlugin, {
                ...pluginConfigDoSimulate,
                simulateIdentifyCase: "GoodScoreNoImage"
            },
            [": Pl@ntNet identifie (à 82.23%) NoImagium SIMULATINIUM", plantnetPluginDefaultTag]);
    }).timeout(60 * 1000);

    it("Pl@ntNet plugin - id. BAD_SCORE", async () => {
        await verifyPluginProcessResult(plantnetPlugin, {...pluginConfigDoSimulate, simulateIdentifyCase: "BadScore"},
            ["identification par Pl@ntNet n'a pas donné de résultat assez concluant"]);
    }).timeout(60 * 1000);

});
describe("🧪🧩 31 - Ask-Pl@ntNet Plugin\n", function () {

    before(() => {
        askPlantnetPlugin = appConfig.get('askPlantnet');
    });

    it("Ask-Pl@ntNet plugin - id. OK images", async () => {
        await verifyPluginProcessResult(askPlantnetPlugin, pluginConfigDoSimulate,
            [": Pl@ntNet identifie (à 85.09%) Pancratium SIMULATINIUM", plantnetAskPluginDefaultTag]);
    }).timeout(60 * 1000);

    it("Ask-Pl@ntNet plugin - id. OK no image", async () => {
        await verifyPluginProcessResult(askPlantnetPlugin, {
                ...pluginConfigDoSimulate,
                simulateIdentifyCase: "GoodScoreNoImage"
            },
            [": Pl@ntNet identifie (à 82.23%) NoImagium SIMULATINIUM", plantnetAskPluginDefaultTag]);
    }).timeout(60 * 1000);

    it("Ask-Pl@ntNet plugin - id. BAD_SCORE", async () => {
        await verifyPluginProcessResult(askPlantnetPlugin, {
                ...pluginConfigDoSimulate,
                simulateIdentifyCase: "BadScore"
            },
            ["identification par Pl@ntNet n'a pas donné de résultat assez concluant"]);
    }).timeout(60 * 1000);

});
describe("🧪🧩 32 - UnMute Plugin\n", function () {

    before(() => {
        unmutePlugin = appConfig.get('unmute');
    });

    it("UnMute plugin", async () => {
        await verifyPluginProcessResult(unmutePlugin, {}, ["Démasqué martijnrijk"]);
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
