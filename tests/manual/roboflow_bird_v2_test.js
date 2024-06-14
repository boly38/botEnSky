/// gist : https://gist.github.com/boly38/5752000289342895a6008e53df2c6c9f
// from: https://github.com/boly38/botEnSky/issues/57
// ----------------------------
// ReST API to detect bird - from blog : https://blog.roboflow.com/bird-detection-api/

// API_KEY - REQUIRED - export ROBOFLOW_API_KEY=xxxx
// https://app.roboflow.com / use public plan free and get your api key under profile
const api_key = process.env["ROBOFLOW_API_KEY"] || "unauthorized";

// bird v2 public dataset  based on JS sample provided
// https://universe.roboflow.com/leem-pf8fb/bird-v2/dataset/2/download
const url = "https://detect.roboflow.com/bird-v2/2";

import axios from "axios";
import fs from "fs";

const detectLocalImage = async () => {
// from "https://www.birds.cornell.edu/home/wp-content/uploads/2023/09/334289821-Baltimore_Oriole-Matthew_Plante.jpg";
    const defaultImageFile = "tests/manual/334289821-Baltimore_Oriole-Matthew_Plante.jpg";
    const imageFile = process.env["IMAGE_FILE"] || defaultImageFile;

    console.log(`detectLocalImage ${imageFile}`)
    const image = fs.readFileSync(imageFile, {
        encoding: "base64"
    })

    const response = await axios({
        method: "POST",
        url,
        params: {api_key},
        data: image,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).catch(error => console.error(error.message));
    if (response) {
        console.log(response.data);
    }
    /**
     * Example
     * {
     *   time: 0.05046642000002066,
     *   image: { width: 1280, height: 960 },
     *   predictions: [
     *     {
     *       x: 624.5,
     *       y: 457,
     *       width: 595,
     *       height: 792,
     *       confidence: 0.6770055890083313,
     *       class: 'orchard-oriole',
     *       class_id: 19,
     *       detection_id: '4c4c2404-f16b-4bd9-9416-e5525e2566fc'
     *     }
     *   ]
     * }
     */
}

const detectRemoteImage = async () => {
    const defaultImageURL = "https://www.nps.gov/articles/images/prothonotary_warbler_npgallery_public_domain_nps_sized.jpg?maxwidth=650&autorotate=false";
    const imageUrl = process.env["IMAGE_URL"] || defaultImageURL;
    console.log(`detectRemoteImage ${imageUrl}`)
    const response = await axios({
        method: "POST",
        url,
        params: {
            api_key,
            image: imageUrl
        }
    }).catch(error => console.error(error.message));
    if (response) {
        console.log(response.data);
    }
    /**
     * {
     *   time: 0.06699739199984833,
     *   image: { width: 650, height: 722 },
     *   predictions: [
     *     {
     *       x: 307,
     *       y: 336.5,
     *       width: 614,
     *       height: 413,
     *       confidence: 0.6883782148361206,
     *       class: 'prothonotary-warbler',
     *       class_id: 21,
     *       detection_id: 'bbcc1fe5-deeb-49bd-8d70-80a1d13d6bc8'
     *     }
     *   ]
     * }
     */
}

await detectLocalImage();
await detectRemoteImage();