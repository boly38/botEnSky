/**
 * 3oly/grBird project hosted on huggingface.co : https://huggingface.co/spaces/3oly/grBird
 * 3oly/grBird is a client of BioCLIP demo
 * cf. BioCLIP credits here : https://github.com/Imageomics/bioclip
 * -- book
 * title: {B}io{CLIP}: A Vision Foundation Model for the Tree of Life,
 * author: Samuel Stevens and Jiaman Wu and Matthew J Thompson and Elizabeth G Campolongo and Chan Hee Song and David Edward Carlyn and Li Dong and Wasila M Dahdul and Charles Stewart and Tanya Berger-Wolf and Wei-Lun Chao and Yu Su
 * booktitle: Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)
 * year: 2024
 */
import {Client} from "@gradio/client";
import {isSet} from "../lib/Common.js";

const GRADIO_APPLICATION_REFERENCE = "3oly/grBird";

export const GR_BIRD_MINIMAL_PERCENT = 55;
const GR_BIRD_MINIMAL_RATIO = GR_BIRD_MINIMAL_PERCENT / 100;

export const IDENTIFY_RESULT = {
    /**
     * prediction result with good enough score
     */
    OK: "OK",
    /**
     * prediction result with too poor score that must not be undertaken
     */
    BAD_SCORE: "BAD_SCORE"
};

export default class GrBirdApiService {

    constructor(loggerService, aviBaseService) {
        this.logger = loggerService.getLogger().child({label: 'GrBirdApiService'});
        this.aviBaseService = aviBaseService;
        this.logger.info(`${GRADIO_APPLICATION_REFERENCE} available`);
    }

    async birdIdentify(options) {
        const {imageUrl, context} = options;
        this.logger.debug(`birdIdentify options : ${JSON.stringify({imageUrl})}`, context);
        let birdResults = await this.api_classification(imageUrl);
        this.logger.debug(`birdResults : ${JSON.stringify(birdResults)}`, context);
        const firstScoredResult = this.hasScoredResult(birdResults, GR_BIRD_MINIMAL_RATIO);
        if (!firstScoredResult) {
            return {"result": IDENTIFY_RESULT.BAD_SCORE};
        }
        const {species} = firstScoredResult;
        let scoredResult = 'BioClip identify ' + this.resultInfoOf(firstScoredResult)
        if (isSet(species)) {
            const speciesLink = await this.aviBaseService.getSpeciesLink(species);
            if (isSet(speciesLink)) {
                scoredResult += `\n\n${speciesLink}`;
            }
        }
        return {"result": IDENTIFY_RESULT.OK, "bioResult": {species, scoredResult}};
    }

    async api_classification(image_url = null) {
        this.logger.info(`Bioclip classification for the following image : ${image_url}`);
        const client = await Client.connect("3oly/grBird");
        const result = await client.predict("/api_classification", [image_url]);
        const {data} = result;
        return data[0];
    }

    hasScoredResult(birdPredictions, minimalScore) {
        if (!birdPredictions || birdPredictions.length < 1) {
            return false;
        }
        let resArray = birdPredictions.filter((res) => {
            return (res.score > minimalScore);
        });
        return resArray.length > 0 ? resArray[0] : false;
    }

    resultInfoOf(aResult) {
        if (!isSet(aResult)) {
            return "";
        }
        const {score, common_name, species, genus, family} = aResult; /* AND: species_epithet, order, class, pylum, kingdom */
        let scorePercent = (score * 100).toFixed(2);

        let infoOf = `(at ${scorePercent}%)`;
        if (species) {
            infoOf += ` ${species}`;
        }
        if (genus) {
            infoOf += ` genus:${genus}`;
        }
        if (family) {
            infoOf += ` (fam. ${family})`;
        }
        if (isSet(common_name)) {
            infoOf += ` com. ${common_name}`;
        }
        return infoOf;
    }
}
