import {ReasonPhrases, StatusCodes} from "http-status-codes";
import {isSet} from "node:util/types";
import i18n from "i18n";

export default class TooManyRequestsException {
    constructor(message = null) {
        this.code = ReasonPhrases.TOO_MANY_REQUESTS;
        this.status = StatusCodes.TOO_MANY_REQUESTS;
        this.message = isSet(message) ? message : i18n.__('server.error.tooManyRequests');
    }
}