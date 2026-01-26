/**
 * URL Shortener Service
 * 
 * Uses is.gd service for URL shortening
 * Official website: https://is.gd/
 * API documentation: https://is.gd/developers.php
 * 
 * Features:
 * - Direct 301 redirect (no intermediate page)
 * - No tracking, no user data collection
 * - Free service with reasonable usage limits
 * - No API key required
 * - Service online since 2006
 * 
 */

import axios from "axios";

/**
 * Shorten URL using is.gd service
 * 
 * @param {Object} logger - Logger instance
 * @param {string} imageUrl - URL to shorten
 * @param {string} text - Text prefix for the shortened URL
 * @returns {Promise<string|boolean>} Shortened URL with text prefix or false if imageUrl is null
 * 
 * @example
 * buildShortUrlWithText(logger, 'https://example.com/very/long/url', 'Example: ')
 * // Returns: "Example: https://is.gd/abc123"
 */
export const buildShortUrlWithText = (logger, imageUrl, text) => {
    return new Promise(resolve => {
        if (imageUrl === null) {
            return resolve(false);
        }
        
        // is.gd API - no key required, no intermediate page, direct 301 redirect
        const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(imageUrl)}`;
        
        axios.get(apiUrl, { timeout: 5000 })
            .then(response => {
                const shortenUrl = response.data.trim();
                resolve(`${text}${shortenUrl}`);
            })
            .catch(err => {
                logger.warn(`Unable to use is.gd for this url : ${imageUrl} - details: ${err?.message}`);
                // Fallback to full URL if shortening fails
                resolve(`${text}\n${imageUrl}`);
            });
    });
}
