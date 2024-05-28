import fs from 'fs';
import superagent from 'superagent';
import TinyURL from 'tinyurl';
import {isSet} from "../lib/Common.js";

const MY_API_PLANTNET_V2_URL = 'https://my-api.plantnet.org/v2/identify/all';

// Pl@ntNet API : https://github.com/plantnet/my.plantnet/blob/master/README.md
export default class PlantnetService {

    constructor(config, loggerService) {
        this.isAvailable = false;
        this.logger = loggerService.getLogger().child({label: 'PlantnetService'});

        this.apiKey = config.plantnet.apiKey;
        if (!isSet(this.apiKey)) {
            this.logger.error("PlantnetService, please setup your environment");
            return;
        }
        this.isAvailable = true;
        this.logger.info("available");
    }

    isReady() {
        return this.isAvailable;
    }

    identify(options) {
        const service = this;
        let {imageUrl, doSimulateIdentify, simulateIdentifyCase} = options;
        doSimulateIdentify = !(doSimulateIdentify === false) || imageUrl === undefined;
        const identifyAddOn = doSimulateIdentify ? `| SIMULATE ${simulateIdentifyCase ? simulateIdentifyCase : ''}| ` : "";
        service.logger.info(`Pla@ntNet identify ${identifyAddOn}following image : ${imageUrl}`);

        return new Promise((resolve, reject) => {
            if (doSimulateIdentify) {
                const fileSuffix =
                    simulateIdentifyCase === "BadScore" ? 'BadScore' :
                        simulateIdentifyCase === "GoodScoreNoImage" ? 'GoodScoreNoImage' : 'GoodScoreImages';
                const simulatedAnswer = JSON.parse(fs.readFileSync(`./src/data/plantNetFrenchResponse${fileSuffix}.json`, 'utf8'));
                return resolve(simulatedAnswer);
            }

            // https://my.plantnet.org/account/doc // v2
            superagent.get(MY_API_PLANTNET_V2_URL)
                .query({
                    "images": [imageUrl, imageUrl],
                    "organs": ["flower", "leaf"],
                    "include-related-images": true,
                    "lang": "fr",
                    "api-key": service.apiKey,
                })
                .end((err, res) => {
                    if (err) {
                        let errStatus = err.status;
                        let errError = err.message;
                        let errDetails = err.response.text;
                        let errResult = "Pla@ntnet identify error (" + errStatus + ") " + errError;
                        service.logger.error(errResult + " - details:" + errDetails);
                        reject({message: errResult, status: errStatus});
                        return;
                    }
                    resolve(res.body);
                });
        })
    }

    resultInfoOf(aResult) {
        if (!aResult) {
            return "";
        }
        let score = aResult.score;
        let scorePercent = (score * 100).toFixed(2);
        let scientificName = aResult.species ? aResult.species.scientificNameWithoutAuthor : false;
        let family = aResult.species && aResult.species.family ? aResult.species.family.scientificNameWithoutAuthor : false;
        let commonNamesArray = aResult.species ? aResult.species.commonNames : false;

        let infoOf = `(à ${scorePercent}%)`;
        if (scientificName) {
            infoOf += ` ${scientificName}`;
        }
        if (family) {
            infoOf += ` (fam ${family})`;
        }
        if (this.arrayWithContent(commonNamesArray)) {
            let commonNamesArrayStr = commonNamesArray.join(', ');
            infoOf += ` com. ${commonNamesArrayStr}`;
        }
        return infoOf;
    }

    resultFirstImage(aResult) {
        return isSet(aResult) && aResult.images && aResult.images[0] ? aResult.images[0] : null;
    }

    resultImageOriginalUrl(aResultImage) {
        const imageUrl = isSet(aResultImage) ? aResultImage.url : null;
        if (!isSet(imageUrl)) {
            return null;
        }
        return imageUrl.o ? imageUrl.o : imageUrl.m ? imageUrl.m : imageUrl.s;
    }

    resultImageToAlternateText(firstImage, contextDetail) {
        const imageText = this.resultImageToText(firstImage);
        return `${imageText} comme image exemple pour le résultat suivant: ${contextDetail}`
    }

    resultImageToText(firstImage) {
        let imageCredits = firstImage.author; // firstImage.citation is too long for a tweet constraint
        let imageOrgan = firstImage.organ === 'flower' ? "fleur" :
            firstImage.organ === 'leaf' ? 'feuille' : false;
        let imageOf = imageCredits;
        if (imageOrgan) {
            imageOf = `${imageOrgan} - ${imageOf}`;
        }
        return imageOf;
    }

    hasScoredResult(plantnetResponse, minimalScore) {
        if (!plantnetResponse || !plantnetResponse.results) {
            return false;
        }
        let resArray = plantnetResponse.results;
        resArray = resArray.filter((res) => {
            return (res.score > minimalScore);
        });
        return resArray.length > 0 ? resArray[0] : false;
    }

    arrayWithContent(arr) {
        return (Array.isArray(arr) && arr.length > 0);
    }
}
