// import ApplicationConfig from '../src/config/ApplicationConfig.js';
import {initEnv, testLogger} from "./libTest.js";
import {describe, it} from "mocha";
import ApplicationConfig from "../src/config/ApplicationConfig.js";

initEnv();

describe("🧪🧪 99 - After all", () => {
    it("should shutdown", async () => {
        testLogger.info("you're done");
        await ApplicationConfig.shutdown();
    });
});