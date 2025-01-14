// {"kingdom":"Animalia","phylum":"Chordata","class":"Aves","order":"Psittaciformes","family":"Cacatuidae","genus":"Nymphicus","species_epithet":"hollandicus",
//  "species":"Nymphicus hollandicus","common_name":"Cockatiel","score":0.5828565359115601},

// avi base
// https://avibase.bsc-eoc.org/api/v2/ref/search/species?term=Nymphicus%20hollandicus
// ---
/*
{
language: "Scientific",
label: "Nymphicus hollandicus (Domestic type) (Nymphicus hollandicus (Domestic type))",
value: "5ABBD836"
},
{
language: "Scientific",
label: "Nymphicus hollandicus (Nymphicus hollandicus)",
value: "FDAEA60A"
},
 */
// => https://avibase.bsc-eoc.org/species.jsp?lang=EN&avibaseid=FDAEA60A&sec=flickr


import axios from "axios";
import {buildShortUrlWithText} from "../lib/Common.js";

const AVI_BASE_API_V2_SEARCH_SPECIES = "https://avibase.bsc-eoc.org/api/v2/ref/search/species"

export default class AviBaseService {

    constructor(loggerService) {
        this.logger = loggerService.getLogger().child({label: 'AviBaseService'});
        this.avibase_api = axios.create({
            baseURL: AVI_BASE_API_V2_SEARCH_SPECIES,
        });
    }

    async getSpeciesLink(species = null) {
        const speciesValue = await this.getSpeciesValueOrNull(species);
        if (speciesValue !== null) {
            const longUrl = `https://avibase.bsc-eoc.org/species.jsp?lang=EN&avibaseid=${speciesValue}&sec=flickr`;
            // DEBUG // console.log(`getSpeciesLink ${longUrl} shorted`);
            return buildShortUrlWithText(this.logger, longUrl, "Avibase flickr\n");
        }
        return null;
    }

    getSpeciesValueOrNull(species = null) {
        if (species === null) {
            return null;
        }
        return new Promise(resolve => {
            this.avibase_api.get("", {"params": {"term": species}})
                .then(result => {
                    const {data} = result;
                    const refined = data.filter(d => d.label === `${species} (${species})`);
                    if (refined.length > 0) {
                        return resolve(refined[0].value);
                    }
                    const refinedBis = data.filter(d => d.label.startsWith`${species} (`);
                    if (refinedBis.length > 0) {
                        return resolve(refinedBis[0].value);
                    }
                    resolve(null);
                })
                .catch(err => {
                    this.logger.warn(`Unable to use avibase_api for this species : ${species} - details: ${err?.message}`);
                    resolve(null);
                });
        });
    }
}