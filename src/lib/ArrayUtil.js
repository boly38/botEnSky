import {isSet} from "./Common.js";

export const arrayIsNotEmpty = arr => isSet(arr) && arr.length > 0;

/**
 * Utility function: get a random element from an array
 * @param array
 * @returns {*}
 */
export const arrayGetRandomElement = array => {
    return array[Math.floor(Math.random() * array.length)];
}

export const shuffledArray = array => array.sort(() => Math.random() - 0.5);
export const shuffleArrayByFisherYates = array => {// Fisher-Yates algo
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Échange
    }
    return array;
}