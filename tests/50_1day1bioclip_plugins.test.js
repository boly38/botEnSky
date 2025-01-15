import {before, describe, it} from 'mocha';
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {initEnv, verifyPluginProcessResult} from "./libTest.js";

initEnv();
const appConfig = ApplicationConfig.getInstance();
const pluginConfigDoSimulate = {doSimulate: true};
const pluginDefaultTag = "#1Day1Bioclip";
let plugin;

describe("🧪🧩 50 - oneDayOneBioClip Plugin\n", () => {

    before(() => {
        plugin = appConfig.get('oneDayOneBioclip');
    });

    it("oneDayOneBioclip plugin - work", async () => {
        await verifyPluginProcessResult(plugin, pluginConfigDoSimulate, [pluginDefaultTag]);
    }).timeout(60 * 1000);

});


