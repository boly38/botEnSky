import console from "node:console";
// https://betterstack.com/docs/logs/javascript/winston/
import winston from "winston";
import {Logtail} from "@logtail/node";
import {LogtailTransport} from "@logtail/winston";
import {isSet} from "../lib/Common.js"; // https://betterstack.com/docs/logs/javascript/winston/
export default class LoggerService {
    constructor(config) {
        this.config = config;
        this.buildLogtail();// https://logs.betterstack.com/ (ex. logtail) service
        this.buildLogger();// https://github.com/winstonjs/winston logger that could embed logtail transport
    }

    buildLogtail() {
        this.logtail = null;
        // Create a Logtail client
        let sourceToken = this.config?.log?.logtailToken;
        if (isSet(sourceToken)) {
            this.logtail = new Logtail(sourceToken);
        }
    }


    buildLogger() {
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
                    const userInfo = isSet(info.remoteAddress) ? ` 👤 ${info.remoteAddress}` : "";// for api call : remote address
                    const pluginInfo = isSet(info.pluginName) ? ` 🖥️ ${info.pluginName} ` : "";// for plugin business : plugin name
                    return `${info.timestamp} [${info.level.padEnd(5)}]${labelInfo}${pluginInfo}${userInfo} ${info.message}`;
                })
            )
        });

        if (isSet(this.logtail)) { // https://logs.betterstack.com
            const transports = [new LogtailTransport(this.logtail), consoleTransport];
            this._winstonLogger = winston.createLogger({transports});
            console.log(` ☑  winston logtail logger`);
        } else {
            const transports = [consoleTransport];
            this._winstonLogger = winston.createLogger({transports});
            console.log(` ☑  winston console logger`);
        }
    }

    /**
     * to use in service/class init to bootstrap a logger
     * doc: https://github.com/winstonjs/winston?tab=readme-ov-file#creating-child-loggers
     * example: this.logger = loggerService.getLogger().child({ label: 'ExpressServer' });
     * @returns {winston.Logger | *}
     */
    getLogger() {
        return this._winstonLogger;
    }

    flush() {
        if (this.logtail === null) {
            return Promise.resolve;
        }
        return this.logtail.flush();
    }

}