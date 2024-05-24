/* jshint expr: true */    // for to.be.empty
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

    it("simulate plantnet identification with good score", async () => {

        const result = await plugin.process(pluginConfigDoSimulate).catch(err => {
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
            expect(result.text).to.contains("Réponse prévue : Pl@ntnet identifie (à 85.09%)");
        }

    }).timeout(60 * 1000);

    it("simulate plantnet identification with bad score", async () => {
        const simulateIdentifyCase = "BadScore"
        const result = await plugin.process({...pluginConfigDoSimulate, simulateIdentifyCase}).catch(err => {
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
            expect(result.text).to.contains("Réponse prévue : Bonjour, une interrogation de Pl@ntnet (1ère image) n'a pas donné de résultat concluant");
        }

    }).timeout(60 * 1000);

});