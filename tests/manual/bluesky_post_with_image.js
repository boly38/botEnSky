// gist / https://gist.github.com/boly38/c01b3c685f92d111b0a4968d6ae7ca63
import axios from "axios";
import {BskyAgent} from '@atproto/api'

const identifier = process.env.BLUESKY_EMAIL;
const password = process.env.BLUESKY_PASSWORD;
const service = "https://api.bsky.social";
const agent = new BskyAgent({service})
await agent.login({identifier, password});

/**
 * Fetch image and get it's base64 value plus encoding as result
 * @param imageUri
 * @returns {Promise<{base64: string, encoding: *}>}
 */
const getImageUriEncodingAndBase64 = imageUri => {
    return axios
        .get(imageUri, {
            responseType: 'arraybuffer'
        })
        .then(response => {
            const encoding = response.headers["content-type"];
            const buffer = Buffer.from(response.data, 'binary');/* incoming data are binary */
            const base64 = buffer.toString('base64');
            return {encoding, buffer, base64}
        })
};

const imageExample = "https://bs.plantnet.org/image/o/da65bab7ff4708f64db9d00ebb68b5dbfa2a4534";
const createdAt = new Date().toISOString();
const text = "PoC post with embed image";
const alt = "this is embed image alt text";

console.log(`getImageUriEncodingAndBase64(${imageExample})`)
getImageUriEncodingAndBase64(imageExample)
    .then(result => {
        const {encoding, buffer, base64} = result;
        if (encoding === undefined) {
            throw new Error("encoding is undefined");
        }
        if (base64?.length < 1) {
            throw new Error("image is empty");
        }
        if (base64?.length > 1000000) {
            throw new Error(`image file size too large (${base64?.length}). 1000000 bytes maximum`);
        }
        console.log(`base64?.length=${base64?.length} encoding=${encoding}`)
        // create blueSky blob of image
        agent.uploadBlob(buffer, {encoding})
            .then(upBlobResponse => {
                const {data} = upBlobResponse;
                const embed = {
                    $type: 'app.bsky.embed.images',
                    images: [ // can be an array up to 4 values
                        {alt, "image": data.blob}
                    ]
                };
                agent.post({
                    text, createdAt, embed
                })
                    .then(() => {
                        console.log("OK")
                    })
                    .catch(err => {
                        console.error(`unable to post : ${err.message}`)
                    });
            });
    });