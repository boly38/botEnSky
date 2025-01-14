import {isSet} from "./Common.js";

export const limitString = (value, maxLength = 50) => {
    if (!isSet(value)) {
        return value;
    }
    if (value.length > 3 && value.length > maxLength) {
        return value.substring(0, maxLength - 3) + "...";
    }
    return value;
}

// https://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end
export const toBase64 =  buffer => buffer.toString('base64');