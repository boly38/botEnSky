import {Buffer} from 'node:buffer';
import sharp from 'sharp';
import axios from 'axios';
import {toBase64} from "../lib/StringUtil.js";
import {timeout} from "../lib/Common.js";

export default class ResizeService {
    constructor(config, loggerService) {
        this.cpuIsShared = config.cpuIsShared;
        this.logger = loggerService.getLogger().child({label: 'ResizeService'});
        this.debugResponseTime = process.env.DEBUG_RESPONSE_TIME === 'true';
        // In test mode, use 5s timeout; in production, use 30s
        this.httpTimeout = process.env.NODE_ENV === 'test' ? 5000 : 30000;
    }

    async resizeImageUrl(imageUrl, bufferMaxLength = 1000000) {
        const response = await this._fetchImageWithTiming(imageUrl);
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
        const {logger, cpuIsShared} = this;
        let buffer;
        let quality = 100;
        do {
            quality -= 10;// decrease quality step by step
            buffer = await sharp(inputBuffer)
                .jpeg({quality})
                .toBuffer();
            logger.info(`resizeImageBuffer:${inputBuffer.length} => quality ${quality} : length:${buffer.length}`);
            if (cpuIsShared) {
                sharp.cache(false);// resources: free unused buffer to save memory
                sharp.concurrency(1); // resources: 1 thread to minimize CPU and memory consumption
            }
        } while (
            !isBufferSizeValidated(buffer)
            && quality > 10
            && await this.hasToPreserveSharedCPU()
            )
        return {buffer, quality};
    }


    async getEncodingBufferAndBase64FromUri(imageUrl, options) {
        const {bufferMaxSize} = options;
        const response = await this._fetchImageWithTiming(imageUrl);
        const encoding = response.headers["content-type"];
        if (encoding === undefined) {
            throw new Error("encoding is undefined");
        }
        const inBuffer = Buffer.from(response.data, 'binary');/* incoming data are binary */
        if (inBuffer?.length < 1) {
            throw new Error("image is empty");
        }
        const isB64BufferLessThanMax = buffer => !bufferMaxSize || toBase64(buffer).length < bufferMaxSize;
        const {buffer, quality} = await this.resizeImageBuffer(inBuffer, isB64BufferLessThanMax);
        const base64 = toBase64(buffer);
        if (base64.length >= bufferMaxSize) {
            throw new Error(`image file size too large (${base64?.length}). ${bufferMaxSize} bytes maximum`);
        }
        return {encoding, buffer, base64, quality};
    }


    /**
     * poor workaround to avoid app to be killed by onrender.com due to heavy load
     * TO FIX: proper way to handle this is rate limiter
     */
    async hasToPreserveSharedCPU(nbSec = 10) {
        const {cpuIsShared, logger} = this;
        if (!cpuIsShared) {
            return true;// no need to preserve cpu
        }
        logger.info(`preservedSharedCPU ${nbSec} sec`);
        await timeout(nbSec * 1000);
        return true;
    }

    async _fetchImageWithTiming(imageUrl) {
        const startTime = Date.now();
        try {
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: this.httpTimeout
            });
            const duration = Date.now() - startTime;
            if (this.debugResponseTime) {
                this.logger.info(`_fetchImageWithTiming[${imageUrl.substring(0, 80)}]: ${duration}ms (timeout: ${this.httpTimeout}ms)`);
            }
            return response;
        } catch (err) {
            const duration = Date.now() - startTime;
            this.logger.warn(`_fetchImageWithTiming failed after ${duration}ms (timeout: ${this.httpTimeout}ms): ${err.message}`);
            throw err;
        }
    }
}
