import {before, describe, it} from 'mocha';
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {initEnv, verifyPluginProcessResult} from "./libTest.js";

initEnv();
const appConfig = ApplicationConfig.getInstance();
const pluginConfigDoSimulate = {
    doSimulate: true,
    doSimulateSearch: true,
    searchSimulationFile: "blueskyPostFakeFlower"
};
const pluginConfigDoSimulateAsk = {
    doSimulate: true,
    doSimulateSearch: true,
    searchSimulationFile: "blueskyPostFakeAskBot"
};
const plantnetPluginDefaultTag = "#BeSPlantnet #IndentificationDePlantes";
const plantnetAskPluginDefaultTag = "#BeSAskPlantnet #IndentificationDePlantes";
let plantnetPlugin;
let askPlantnetPlugin;

// v2 tests example : https://github.com/PLhery/node-twitter-api-v2/blob/master/test/tweet.v2.test.ts
describe("🧪🧩 30 - Pl@ntNet Plugin\n", () => {

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
            ["L'identification par Plantnet n'a pas donné de résultat assez concluant 😩 (score<20%)"]);
    }).timeout(60 * 1000);

});

describe("🧪🧩 31 - Ask-Pl@ntNet Plugin\n", () => {

    before(() => {
        askPlantnetPlugin = appConfig.get('askPlantnet');
    });

    it("Ask-Pl@ntNet plugin - id. OK images", async () => {
        await verifyPluginProcessResult(askPlantnetPlugin, pluginConfigDoSimulateAsk,
            [": Pl@ntNet identifie (à 85.09%) Pancratium SIMULATINIUM", plantnetAskPluginDefaultTag]);
    }).timeout(60 * 1000);

    it("Ask-Pl@ntNet plugin - id. OK no image", async () => {
        await verifyPluginProcessResult(askPlantnetPlugin, {
                ...pluginConfigDoSimulateAsk,
                simulateIdentifyCase: "GoodScoreNoImage"
            },
            [": Pl@ntNet identifie (à 82.23%) NoImagium SIMULATINIUM", plantnetAskPluginDefaultTag]);
    }).timeout(60 * 1000);

    it("Ask-Pl@ntNet plugin - id. BAD_SCORE", async () => {
        await verifyPluginProcessResult(askPlantnetPlugin, {
                ...pluginConfigDoSimulateAsk,
                simulateIdentifyCase: "BadScore"
            },
            ["L'identification par AskPlantnet n'a pas donné de résultat assez concluant 😩 (score<20%)"]);
    }).timeout(60 * 1000);

    //NB: AskPlugin DONT mute initial post author 

});

