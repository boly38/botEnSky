/**
 * export PLANTNET_API_PRIVATE_KEY=dummy
 * SIMULATION
 * node ./tests/manual/plantnet_identify_image.js --simulate --simulate-case=GoodScoreImages
 * REAL
 * node ./tests/manual/plantnet_identify_image.js
 * node ./tests/manual/plantnet_identify_image.js <imageUrl>
 */
import PlantnetApiService, {IDENTIFY_RESULT} from '../../src/servicesExternal/PlantnetApiService.js';
import superagent from 'superagent';
import sharp from 'sharp';

const DEFAULT_IMAGE_URL = 'https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:umlxafzutkwwnbonfpz7iazr/bafkreiat6qbyerjvdnuv3fqhxlxwj6br2qr3dg7h6w4ap2h6hf773rd6qm';
const MINIMAL_RATIO = 0.2;
const PLANTNET_SUPPORTED_FORMATS = ['jpeg', 'png'];

/** Log une etape du script pour suivre l'exécution de bout en bout. */
function logStep(step, message) {
    console.log(`[manual-plantnet][${step}] ${message}`);
}

/** Log un bloc JSON utile au debug manuel. */
function logData(label, data) {
    console.log(`[manual-plantnet][data] ${label}: ${JSON.stringify(data)}`);
}

/** Lit les arguments CLI et applique les valeurs par defaut. */
function parseArgs(argv) {
    const args = argv.slice(2);
    const imageUrlArg = args.find((arg) => !arg.startsWith('--'));
    const imageUrl = imageUrlArg || DEFAULT_IMAGE_URL;
    return {imageUrl};
}

/** Verifie que l'entree est bien une URL HTTP(S). */
function assertDirectImageUrl(imageUrl) {
    if (!/^https?:\/\//.test(imageUrl)) {
        throw new Error('Argument invalide: URL HTTP(S) attendue.');
    }
}

/**
 * Detecte le format reel de l'image via les metadonnees sharp (magic bytes).
 * Retourne 'jpeg', 'png', 'webp', 'gif', etc., ou null si non detectable.
 */
async function detectImageFormat(imageBuffer) {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        return metadata.format || null;
    } catch {
        return null;
    }
}

/**
 * Derive un format probable depuis l'URL.
 * Si aucune extension n'est presente, on considere webp.
 */
function guessFormatFromUrl(imageUrl) {
    try {
        const pathname = new URL(imageUrl).pathname;
        const fileName = pathname.split('/').pop() || '';
        if (!fileName.includes('.')) {
            logStep('detect:url', 'Aucune extension dans l URL, format suppose: webp');
            return 'webp';
        }
        const extension = fileName.split('.').pop().toLowerCase();
        return extension === 'jpg' ? 'jpeg' : extension;
    } catch {
        return null;
    }
}

/**
 * Convertit le buffer en JPEG si le format n'est pas supporte par PlantNet (jpeg/png).
 * Retourne { buffer, format, converted }.
 */
async function convertToJpegIfNeeded(imageBuffer, detectedFormat) {
    if (PLANTNET_SUPPORTED_FORMATS.includes(detectedFormat)) {
        logStep('convert:skip', `Format ${detectedFormat} supporte nativement par PlantNet, pas de conversion`);
        return {buffer: imageBuffer, format: detectedFormat, converted: false};
    }
    const sizeBefore = imageBuffer.length;
    logStep('convert:start', `Format "${detectedFormat || 'inconnu'}" non supporte, conversion vers jpeg`);
    const convertedBuffer = await sharp(imageBuffer).jpeg({quality: 90}).toBuffer();
    logStep('convert:done', `jpeg produit: ${sizeBefore} octets → ${convertedBuffer.length} octets`);
    return {buffer: convertedBuffer, format: 'jpeg', converted: true};
}

/** Convertit la reponse brute PlantNet en resultat simplifie pour le script manuel. */
function buildPlantnetResultFromApi(plantnetApiService, rawPlantnetResponse) {
    logStep('plantnet:parse', 'Analyse de la reponse PlantNet');
    const firstScoredResult = plantnetApiService.hasScoredResult(rawPlantnetResponse, MINIMAL_RATIO);
    if (!firstScoredResult) {
        logStep('plantnet:parse', `Aucun resultat au-dessus du seuil ${(MINIMAL_RATIO * 100).toFixed(0)}%`);
        return {result: IDENTIFY_RESULT.BAD_SCORE};
    }
    const scoredResult = 'Pl@ntNet identifie ' + plantnetApiService.resultInfoOf(firstScoredResult);
    const firstImage = plantnetApiService.resultFirstImage(firstScoredResult);
    const firstImageOriginalUrl = plantnetApiService.resultImageOriginalUrl(firstImage);
    const firstImageText = plantnetApiService.resultImageToText(firstImage);
    return {result: IDENTIFY_RESULT.OK, plantnetResult: {scoredResult, firstImageOriginalUrl, firstImageText}};
}

/** Telecharge l'image, detecte son format reel, convertit si besoin, puis envoie en multipart/form-data a PlantNet. */
async function identifyByBinaryUpload(plantnetApiService, imageUrl) {
    // 1. Telechargement
    logStep('download:start', `URL: ${imageUrl}`);
    const imageRes = await superagent.get(imageUrl).buffer(true);
    const rawBuffer = Buffer.isBuffer(imageRes.body) ? imageRes.body : Buffer.from(imageRes.text || '', 'binary');
    const httpContentType = imageRes.headers['content-type'] || '(absent)';
    logStep('download:done', `status: ${imageRes.status} | content-type HTTP: ${httpContentType} | taille: ${rawBuffer.length} octets`);

    // 2. Detection du type reel (magic bytes via sharp)
    logStep('detect:start', 'Detection du format reel via contenu binaire (sharp)');
    const detectedFormat = await detectImageFormat(rawBuffer);
    const guessedFormat = guessFormatFromUrl(imageUrl);
    const sourceFormat = detectedFormat || guessedFormat;
    const detectedMime = sourceFormat ? `image/${sourceFormat}` : httpContentType;
    logStep('detect:done', `format detecte: ${detectedFormat || '(aucun)'} | format URL: ${guessedFormat || '(aucun)'} | format retenu: ${sourceFormat || '(inconnu)'} | mime: ${detectedMime}`);

    // 3. Conversion si format non supporte
    const {buffer: finalBuffer, format: finalFormat, converted} = await convertToJpegIfNeeded(rawBuffer, sourceFormat);

    const finalContentType = `image/${finalFormat}`;
    const finalExtension = finalFormat === 'jpeg' ? 'jpg' : finalFormat;
    const fileName = `manual_image.${finalExtension}`;

    logData('image', {
        httpContentType,
        detectedFormat: detectedFormat || '(inconnu)',
        guessedFormat: guessedFormat || '(inconnu)',
        sourceFormat: sourceFormat || '(inconnu)',
        finalFormat,
        converted,
        sizeBytes: finalBuffer.length,
        fileName,
        finalContentType
    });

    // 4. Envoi multipart
    logStep('upload:start', `Envoi multipart vers ${plantnetApiService.plantnetIDApi} | fichier: ${fileName} | mime: ${finalContentType}`);
    const res = await plantnetApiService.plantnetClient
        .post(plantnetApiService.plantnetIDApi)
        .query({
            'api-key': plantnetApiService.apiKey,
            lang: 'fr',
            'include-related-images': true
        })
        .field('organs', 'flower')
        .field('organs', 'leaf')
        .attach('images', finalBuffer, {filename: fileName, contentType: finalContentType})
        .attach('images', finalBuffer, {filename: fileName, contentType: finalContentType});

    logStep('upload:done', `status API: ${res.status}`);
    const payload = buildPlantnetResultFromApi(plantnetApiService, res.body);
    return {...payload, rawResponse: res.body};
}

/** Formate une erreur HTTP/API avec un niveau de detail utile au debug manuel. */
function extractVerboseError(error) {
    const response = error && error.response ? error.response : null;
    return {
        message: error && error.message ? error.message : String(error),
        status: error && error.status ? error.status : response && response.status,
        statusText: response && response.res ? response.res.statusMessage : undefined,
        method: response && response.request ? response.request.method : undefined,
        url: response && response.request ? response.request.url : undefined,
        body: response ? (response.body || response.text) : undefined,
        headers: response ? response.headers : undefined
    };
}

/** Construit un logger minimal compatible avec PlantnetApiService. */
function buildLoggerService() {
    const logger = {
        child: () => logger,
        info: (...args) => console.log(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args),
        debug: (...args) => console.debug(...args)
    };
    return {getLogger: () => logger};
}

/** Construit la config minimale necessaire a PlantNet pour ce test manuel. */
function buildPlantnetConfig() {
    return {
        plantnet: {
            apiKey: process.env.PLANTNET_API_PRIVATE_KEY,
            plantnetIDApi: process.env.PLANTNET_API_IDENTIFY_ALL || 'https://my-api.plantnet.org/v2/identify/all'
        }
    };
}

/** Affiche un resume humain du resultat d'identification. */
function logResult(payload) {
    const {result, plantnetResult} = payload;
    console.log(`Resultat PlantNet: ${result}`);
    if (result === IDENTIFY_RESULT.OK) {
        console.log(`- score: ${plantnetResult.scoredResult}`);
        console.log(`- image source: ${plantnetResult.firstImageOriginalUrl || '(absente)'}`);
        console.log(`- texte image: ${plantnetResult.firstImageText || '(absent)'}`);
    } else if (result === IDENTIFY_RESULT.BAD_SCORE) {
        console.log('- identification trouvee mais score trop faible');
    } else {
        console.log('- aucune identification exploitable');
    }
    logData('payload', payload);
}

/** Orchestration principale: parse args, valide l'URL, detecte/convertit l'image, appelle PlantNet et affiche le resultat. */
async function main() {
    const {imageUrl} = parseArgs(process.argv);
    logData('args', {imageUrl});

    if (!process.env.PLANTNET_API_PRIVATE_KEY) {
        console.error('PLANTNET_API_PRIVATE_KEY est requis.');
        process.exitCode = 1;
        return;
    }

    const plantnetApiService = new PlantnetApiService(buildPlantnetConfig(), buildLoggerService());
    if (!plantnetApiService.isReady()) {
        console.error('PlantnetApiService non disponible.');
        process.exitCode = 1;
        return;
    }

    logStep('start', `URL image: ${imageUrl}`);
    assertDirectImageUrl(imageUrl);

    const payload = await identifyByBinaryUpload(plantnetApiService, imageUrl);
    logStep('done', 'Resultat recu depuis mode binaire');
    logResult(payload);
}

main().catch((error) => {
    const verboseError = extractVerboseError(error);
    logData('error', verboseError);
    console.error('Erreur identification PlantNet:', verboseError.message);
    if (verboseError.status) {
        console.error(`- status: ${verboseError.status} ${verboseError.statusText || ''}`.trim());
    }
    if (verboseError.method || verboseError.url) {
        console.error(`- request: ${verboseError.method || '?'} ${verboseError.url || '?'}`);
    }
    if (verboseError.body) {
        console.error(`- body: ${typeof verboseError.body === 'string' ? verboseError.body : JSON.stringify(verboseError.body)}`);
    }
    process.exitCode = 1;
});

