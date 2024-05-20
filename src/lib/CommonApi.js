import {ReasonPhrases, StatusCodes} from 'http-status-codes';

export const unauthorized = (response, message) => {
    const reason = ReasonPhrases.UNAUTHORIZED;
    response.status(StatusCodes.UNAUTHORIZED).json({reason, message});
}