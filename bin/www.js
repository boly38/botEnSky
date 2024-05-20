import console from "node:console";
import {initEnv} from "./commonEnv.js";
import ApplicationConfig from '../src/config/ApplicationConfig.js';

initEnv();
ApplicationConfig.startServerMode()
                 .catch(console.error);