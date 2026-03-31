import superagent from 'superagent';
import sharp from 'sharp';

const PLANTNET_SUPPORTED_FORMATS = ['jpeg', 'png'];

/**
 * Prepare an image from URL for PlantNet by downloading, detecting and converting when required.
 */
export default class ImageConverterService {
    constructor(loggerService) {
        this.logger = loggerService.getLogger().child({label: 'ImageConverterService'});
    }

    /** Downloads the binary image payload and returns body + HTTP metadata. */
    async downloadImage(imageUrl) {
        this.logger.info(`[image:download:start] ${imageUrl}`);
        const imageRes = await superagent.get(imageUrl).buffer(true);
        const buffer = Buffer.isBuffer(imageRes.body)
            ? imageRes.body
            : Buffer.from(imageRes.text || '', 'binary');
        const httpContentType = imageRes.headers['content-type'] || null;
        this.logger.info(`[image:download:done] status=${imageRes.status} contentType=${httpContentType || 'absent'} size=${buffer.length}`);
        return {buffer, httpContentType, status: imageRes.status};
    }

    /** Detects the real format from binary content (magic bytes), returns null if not detectable. */
    async detectFormatFromBuffer(imageBuffer) {
        try {
            const metadata = await sharp(imageBuffer).metadata();
            return metadata.format || null;
        } catch {
            return null;
        }
    }

    /**
     * Guesses format from URL path; if no extension exists, defaults to webp.
     * This fallback is only used when binary detection fails.
     */
    guessFormatFromUrl(imageUrl) {
        try {
            const pathname = new URL(imageUrl).pathname;
            const fileName = pathname.split('/').pop() || '';
            const hasDot = fileName.includes('.');
            if (!hasDot) {
                this.logger.info('[image:detect:url] no extension in URL, fallback format=webp');
                return 'webp';
            }
            const extension = fileName.split('.').pop().toLowerCase();
            if (extension === 'jpg' || extension === 'jpeg') {
                return 'jpeg';
            }
            if (extension === 'png' || extension === 'webp' || extension === 'gif' || extension === 'avif') {
                return extension;
            }
            return null;
        } catch {
            return null;
        }
    }

    /** Converts unsupported image formats to jpeg and preserves supported formats as-is. */
    async normalizeForPlantnet(imageBuffer, sourceFormat) {
        if (PLANTNET_SUPPORTED_FORMATS.includes(sourceFormat)) {
            this.logger.info(`[image:convert:skip] sourceFormat=${sourceFormat}`);
            return {finalBuffer: imageBuffer, finalFormat: sourceFormat, converted: false};
        }
        this.logger.info(`[image:convert:start] sourceFormat=${sourceFormat || 'unknown'} targetFormat=jpeg`);
        const convertedBuffer = await sharp(imageBuffer).jpeg({quality: 90}).toBuffer();
        this.logger.info(`[image:convert:done] before=${imageBuffer.length} after=${convertedBuffer.length}`);
        return {finalBuffer: convertedBuffer, finalFormat: 'jpeg', converted: true};
    }

    /** End-to-end helper used by PlantNet API upload flow. */
    async downloadAndConvert(imageUrl) {
        const {buffer, httpContentType} = await this.downloadImage(imageUrl);
        const detectedFormat = await this.detectFormatFromBuffer(buffer);
        const urlGuessedFormat = this.guessFormatFromUrl(imageUrl);
        const sourceFormat = detectedFormat || urlGuessedFormat;
        this.logger.info(`[image:detect] detected=${detectedFormat || 'none'} guessed=${urlGuessedFormat || 'none'} selected=${sourceFormat || 'unknown'}`);

        const {finalBuffer, finalFormat, converted} = await this.normalizeForPlantnet(buffer, sourceFormat);
        const extension = finalFormat === 'jpeg' ? 'jpg' : finalFormat;
        const fileName = `plantnet_image.${extension}`;
        const finalContentType = `image/${finalFormat}`;

        return {
            buffer: finalBuffer,
            fileName,
            finalFormat,
            finalContentType,
            converted,
            detectedFormat,
            sourceFormat,
            httpContentType
        };
    }
}

