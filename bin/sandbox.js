import console from "node:console";
import {initEnv} from "./commonEnv.js";
import ApplicationConfig from '../src/config/ApplicationConfig.js';

initEnv();
const appConfig = ApplicationConfig.getInstance();

const showResultAsJson = result => console.log(JSON.stringify(result, null, 2));

let botService = appConfig.get('botService');
botService.run();
const pluginName = "Plantnet";
await botService.process("0.0.0.0", true, pluginName)
    .then(showResultAsJson)
    .catch(console.log)
