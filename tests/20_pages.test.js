import chaiHttp, {request} from "chai-http";
import * as chaiModule from 'chai';
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {before, describe, it} from "mocha";
import {_expectNoError, assumeSuccess, initEnv, testLogger} from "./libTest.js";
import {after} from "node:test";

chaiModule.use(chaiHttp);
let agent;
let expressServer;

describe("🧪🧪 20 - UI - Pages\n", () => {

    before(done => {
        initEnv();
        testLogger.info(`Pages :: before`);
        ApplicationConfig.startServerMode()
            .then(() => {
                expressServer = ApplicationConfig.getInstance().get('expressServer');
                done();
            })
            .catch(_expectNoError)
    });

    after(() => ApplicationConfig.stopServerMode())


    it("get /", done => {
        agent = request.execute(expressServer.listeningServer)
        agent.get("/")
            .end((err, res) => {
                assumeSuccess(err, res);
                done();
            });
    });

    it("get /api/about", done => {
        agent = request.execute(expressServer.listeningServer)
        agent.get("/api/about")
            .end((err, res) => {
                assumeSuccess(err, res);
                done();
            });
    })

});

