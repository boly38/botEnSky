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