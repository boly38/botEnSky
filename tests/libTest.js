import {expect} from "chai";
import dotEnvFlow from 'dotenv-flow';
import winston from "winston";
import {isSet} from "../src/lib/Common.js";

const buildTestLogger = () => {
    const format = winston.format;
    winston.addColors({
        info: 'white',
        error: 'red',
        warn: 'yellow',
        debug: 'cyan'
    });

    // https://stackoverflow.com/questions/10271373/node-js-how-to-add-timestamp-to-logs-using-winston-library
    // Limitations: if you colorize all: true or level: true then the padEnd on level is not applied. If you use format.align, this align only the message start part..
    const consoleTransport = new winston.transports.Console({
        "format": format.combine(
            format.colorize({message: true}),
            format.timestamp({
                format: 'DD-MM-YYYY HH:mm:ss.SSS'
            }),
            format.printf(info => {
                const labelInfo = isSet(info.label) ? ` 🧾️${info.label} -` : "";// logger name from class init
                return `${info.timestamp} [${info.level.padEnd(5)}]${labelInfo} ${info.message}`;
            })
        )
    });

    const transports = [consoleTransport];
    const level = process.env.DEBUG_TEST === 'true' ? 'debug' : 'info';
    console.log(` ☑  test: winston console logger (${level})`);
    return winston.createLogger({
        transports, level
    }).child({label: 'Test 🧪'});
}
export const testLogger = buildTestLogger();
export const initEnv = () => {
    //~ project init of environment
    dotEnvFlow.config({path: 'env/'});
}
export const _expectNoError = (err) => {
    console.error("_expectNoError", err);
    console.trace();// print stack
    expect.fail(err);
}
export const assumeSuccess = (err, res) => {
    if (err) {
        expect.fail(err);
    }
    if (res.status && (res.status < 200 || res.status > 299)) {
        console.log("res status:", res.status, "body:", res.body);
    }
    expect(res.status).to.be.within(200, 299, `response status 2xx success expected`);
}


export const verifyPluginProcessResult = async (plugin, config, expectedResultTexts)=> {
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
