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
        const speciesValue = await this.getSpeciesValue(species);
        if (speciesValue !== null) {
            const longUrl = `https://avibase.bsc-eoc.org/species.jsp?lang=EN&avibaseid=${speciesValue}&sec=flickr`;
            return buildShortUrlWithText(this.logger, longUrl, "Avibase flickr");
        }
        return null;
    }

    async getSpeciesValue(species = null) {
        if (species === null) {
            return null;
        }
        const params = {"term": species};
        const {data} = await this.avibase_api.get("", {params});
        const refined = data.filter(d => d.label === `${species} (${species})`);
        if (refined.length > 0) {
            return refined[0].value;
        }
        const refinedBis = data.filter(d => d.label.startsWith`${species} (`);
        if (refinedBis.length > 0) {
            return refinedBis[0].value;
        }
        // return data[0];
        return null;
    }
}