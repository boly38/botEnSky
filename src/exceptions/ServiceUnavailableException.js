import {ReasonPhrases, StatusCodes} from "http-status-codes";
import {isSet} from "node:util/types";
import i18n from "i18n";

export default class ServiceUnavailableException {
    constructor(message = null) {
        this.code = ReasonPhrases.SERVICE_UNAVAILABLE;
        this.status = StatusCodes.SERVICE_UNAVAILABLE;
        this.message = isSet(message) ? message : i18n.__('server.error.unavailable');
    }
}