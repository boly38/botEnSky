import chaiHttp from "chai-http";
import * as chaiModule from 'chai';
import ApplicationConfig from '../src/config/ApplicationConfig.js';
import log4js from 'log4js';
import {before, describe, it} from "mocha";
import {_expectNoError, assumeSuccess, initEnv} from "./libTest.js";

const chai = chaiModule.use(chaiHttp);

const logger = log4js.getLogger('twitter-service.test');
logger.level = "INFO"; // DEBUG will show api params

let agent;
let expressServer;

describe("Pages", () => {

    before(done => {
        initEnv();
        console.info(`Pages :: before`);
        ApplicationConfig.startServerMode()
            .then(() => {
                expressServer = ApplicationConfig.getInstance().get('expressServer');
                done();
            })
            .catch(_expectNoError)
    });


    it("get /", done => {
        agent = chai.request(expressServer.listeningServer)
        agent.get("/")
            .end((err, res) => {
                assumeSuccess(err, res);
                done();
            });
    });

    it("get /api/about", done => {
        agent = chai.request(expressServer.listeningServer)
        agent.get("/api/about")
            .end((err, res) => {
                assumeSuccess(err, res);
                done();
            });
    })

});

