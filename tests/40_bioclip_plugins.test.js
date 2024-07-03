/* jshint expr: true */        // for to.be.empty
import {before, describe, it} from 'mocha';
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {initEnv, verifyPluginProcessResult} from "./libTest.js";

initEnv();
const appConfig = ApplicationConfig.getInstance();
const pluginConfigDoSimulate = {doSimulate: true, doSimulateSearch: true, searchSimulationFile: "blueskyPostBird"};
const pluginConfigDoSimulateBadScore = {
    doSimulate: true,
    doSimulateSearch: true,
    searchSimulationFile: "blueskyPostBirdBadScore"
};
const bioclipPluginDefaultTag = "#BeSBioClip #TreeOfLife10MPrediction";
let bioclipPlugin;

describe("🧪🧩 40 - bioClip Plugin\n", function () {

    before(() => {
        bioclipPlugin = appConfig.get('bioclip');
    });

    it("BioClip plugin - id. OK images", async () => {
        await verifyPluginProcessResult(bioclipPlugin, pluginConfigDoSimulate,
            ["BioClip identify (at 67.92%) Haliaeetus leucocephalus genus:Haliaeetus (fam. Accipitridae) com. Bald Eagle", bioclipPluginDefaultTag]);
    }).timeout(60 * 1000);

    it("BioClip plugin - id. BAD_SCORE", async () => {
        await verifyPluginProcessResult(bioclipPlugin, pluginConfigDoSimulateBadScore,
            ["L'identification par BioClip n'a pas donné de résultat assez concluant 😩 (score<55%)"]);
    }).timeout(60 * 1000);
});
