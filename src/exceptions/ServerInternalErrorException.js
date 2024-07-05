import {ReasonPhrases, StatusCodes} from "http-status-codes";
import i18n from "i18n";
import {isSet} from "../lib/Common.js";

export default class InternalServerErrorException {
    constructor(message = null) {
        this.code = ReasonPhrases.INTERNAL_SERVER_ERROR;
        this.status = StatusCodes.INTERNAL_SERVER_ERROR;
        this.message = isSet(message) ? message : i18n.__('server.error.internal');
    }
}