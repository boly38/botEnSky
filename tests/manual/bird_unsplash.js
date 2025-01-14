import fetch from 'node-fetch'; // Install via `npm install node-fetch`
import { URLSearchParams } from 'url'; // Native module in Node.js

// Constants
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY; // Replace with your Unsplash API key
// Get an API key on https://unsplash.com/developers

const SEARCH_KEYWORDS = ['bird', 'oiseaux', 'animal'];
const MAX_COLLECTION_RETRIES = 5;

// Utility function: get a random element from an array
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Utility function: build URL with query string
function buildUrl(baseUrl, params) {
    const queryString = new URLSearchParams(params).toString();
    return `${baseUrl}?${queryString}`;
}

// Fetch collections from Unsplash based on a keyword
async function searchCollections(keyword) {
    const url = buildUrl('https://api.unsplash.com/search/collections', {
        query: keyword,
        per_page: 30,
        client_id: UNSPLASH_ACCESS_KEY,
    });

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
}

// Fetch photos from a specific collection
async function searchPhotosInCollection(collectionId) {
    const url = buildUrl(`https://api.unsplash.com/collections/${collectionId}/photos`, {
        per_page: 30,
        client_id: UNSPLASH_ACCESS_KEY,
    });

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data || [];
}

// Check if a photo has already been published (example function, to be replaced by your actual implementation)
function isAlreadyPublished(photoId, lastPublishedId) {
    return photoId === lastPublishedId;
}

// Main function
async function main() {
    if (!UNSPLASH_ACCESS_KEY) {
        console.error('❌ Unsplash API key is missing. Set UNSPLASH_ACCESS_KEY in your environment variables.');
        return;
    }

    const lastPublishedId = "xxx"; // Replace with actual logic to fetch the last published ID

    // Step 1: Choose a random keyword
    const keyword = getRandomElement(SEARCH_KEYWORDS);

    // Step 2: Search collections using the chosen keyword
    const collections = await searchCollections(keyword);
    if (collections.length === 0) {
        console.log('⚠️ No collections found for the keyword:', keyword);
        return;
    }

    let photo;
    let retries = 0;

    // Step 3: Choose a random collection and search photos
    while (!photo && retries < MAX_COLLECTION_RETRIES) {
        const collection = getRandomElement(collections);
        const photos = await searchPhotosInCollection(collection.id);

        // Check if photos are available and not already published
        for (const p of photos) {
            if (!isAlreadyPublished(p.id, lastPublishedId)) {
                photo = p;
                break;
            }
        }
        retries++;
    }

    if (!photo) {
        console.log('❌ No eligible photo found after retries. Activity cancelled.');
        return;
    }

    // Step 4: Perform identification and construct a message
    const message = `
        bioclip identification
        Author: ${photo.user.name}, Service: Unsplash
        French Slug: ${photo.alt_description?.replace(/-/g, ' ') || 'No description'} ZZ
        ALT Description: ${photo.alt_description || 'No description available'}
        Image URL: ${photo.urls.full}
    `.trim();

    // Output the message
    console.log('✅ Generated Message:', message);
}

// Run the main function
main().catch(error => {
    console.error('❌ Error occurred:', error.message);
});
