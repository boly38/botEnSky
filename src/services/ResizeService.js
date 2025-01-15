import {Buffer} from 'node:buffer';
import sharp from 'sharp';
import axios from 'axios';
import {toBase64} from "../lib/StringUtil.js";
import {timeout} from "../lib/Common.js";

export default class ResizeService {
    constructor(config, loggerService) {
        this.cpuIsShared = config.cpuIsShared;
        this.logger = loggerService.getLogger().child({label: 'ResizeService'});
    }

    async resizeImageUrl(imageUrl, bufferMaxLength = 1000000) {
        const response = await axios.get(imageUrl, {responseType: 'arraybuffer'});
        const responseData = response.data;
        const inputBuffer = Buffer.from(responseData);
        const isBufferLessThan1M = buffer => buffer.length < bufferMaxLength;
        const {buffer, quality} = await this.resizeImageBuffer(inputBuffer, isBufferLessThan1M);
        // await fs.writeFile('output.jpg', buffer);
        return {buffer, quality};
    }

    async resizeImageBuffer(inputBuffer, isBufferSizeValidated) {
        if (isBufferSizeValidated(inputBuffer)) {
            return inputBuffer;
        }
        const {logger} = this;
        let buffer;
        let quality = 100;
        do {
            quality -= 5;// decrease quality step by step
            buffer = await sharp(inputBuffer)
                .jpeg({quality})
                .toBuffer();
            logger.info(`resizeImageBuffer:${inputBuffer.length} => quality ${quality} : length:${buffer.length}`);
        } while (
            !isBufferSizeValidated(buffer)
            && quality > 10
            && await this.hasToPreserveSharedCPU()
            )
        return {buffer, quality};
    }


    async getEncodingBufferAndBase64FromUri(imageUrl, options) {
        const {bufferMaxSize} = options;
        const response = await axios.get(imageUrl, {responseType: 'arraybuffer'});
        const encoding = response.headers["content-type"];
        if (encoding === undefined) {
            throw new Error("encoding is undefined");
        }
        const buffer = Buffer.from(response.data, 'binary');/* incoming data are binary */
        if (buffer?.length < 1) {
            throw new Error("image is empty");
        }
        const isB64BufferLessThanMax = buffer => !bufferMaxSize || toBase64(buffer).length < bufferMaxSize;
        const {"buffer": base64Buffer, quality} = await this.resizeImageBuffer(buffer, isB64BufferLessThanMax);
        if (base64Buffer.length >= bufferMaxSize) {
            throw new Error(`image file size too large (${base64Buffer?.length}). ${bufferMaxSize} bytes maximum`);
        }
        return {encoding, buffer, "base64": base64Buffer, quality};
    }


    /**
     * poor workaround to avoid app to be killed by onrender.com due to heavy load
     * TO FIX: proper way to handle this is rate limiter
     */
    async hasToPreserveSharedCPU(nbSec = 5) {
        const {cpuIsShared, logger} = this;
        if (!cpuIsShared) {
            return true;// no need to preserve cpu
        }
        logger.info(`preservedSharedCPU ${nbSec} sec`);
        await timeout(nbSec * 1000);
        return true;
    }
}
