/**
 * URL Shortener Service
 * 
 * Multi-provider URL shortening with fallback support
 *
 * Providers (in order of preference):
 * 1. is.gd - Direct 301 redirect, no tracking, free (since 2006)
 * 2. v.gd - Backup provider with compatible API
 *
 * Features:
 * - Multiple provider support with automatic failover
 * - User-Agent header identifying botEnSky
 * - Improved error logging with status codes and details
 * - CloudFlare challenge detection
 * - Fallback to full URL if all providers fail
 *
 * Official websites:
 * - https://is.gd/
 * - https://v.gd/
 */

import axios from "axios";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get project root directory to read package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../');

// Cache package.json version
let botVersion = '1.0.0'; // fallback
try {
    const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
    botVersion = packageJson.version || botVersion;
} catch (e) {
    // Silently fail, use fallback version
}

/**
 * Shorten URL using multiple providers with fallback
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
        
        // Shorten with multiple providers in fallback order
        _shortenWithFallback(logger, imageUrl, 0, text, resolve);
    });
};

/**
 * List of URL shortener providers ordered by preference
 * Each provider object contains:
 * - name: Provider identifier
 * - buildUrl: Function to build the API URL
 * - parseResponse: Function to extract shortened URL from response
 * - isValidShortUrl: Function to validate the response (optional, checks if URL is valid)
 *
 * Providers:
 * - is.gd: Free, no auth, direct 301 redirect (primary)
 * - v.gd: Free, no auth, compatible API, also a direct service (fallback)
 */
const SHORTENER_PROVIDERS = [
    {
        name: 'is.gd',
        buildUrl: (url) => `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
        parseResponse: (data) => data.trim(),
        isValidShortUrl: (shortUrl) => shortUrl.startsWith('https://is.gd/'),
    },
    {
        name: 'v.gd',
        buildUrl: (url) => `https://v.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
        parseResponse: (data) => data.trim(),
        isValidShortUrl: (shortUrl) => shortUrl.startsWith('https://v.gd/'),
    },
];

/**
 * Attempt to shorten URL with a provider and fallback to next if needed
 *
 * @private
 * @param {Object} logger - Logger instance
 * @param {string} imageUrl - URL to shorten
 * @param {number} providerIndex - Current provider index
 * @param {string} text - Text prefix for the shortened URL
 * @param {Function} resolve - Promise resolve callback
 */
const _shortenWithFallback = (logger, imageUrl, providerIndex, text, resolve) => {
    if (providerIndex >= SHORTENER_PROVIDERS.length) {
        // All providers exhausted, fallback to full URL
        logger.info(`URL shortener unavailable for: ${imageUrl} - using full URL instead`);
        return resolve(`${text}\n${imageUrl}`);
    }

    const provider = SHORTENER_PROVIDERS[providerIndex];
    const apiUrl = provider.buildUrl(imageUrl);

    const axiosConfig = {
        timeout: 5000,
        headers: {
            'User-Agent': _buildUserAgent(),
        },
    };

    axios.get(apiUrl, axiosConfig)
        .then(response => {
            const shortenUrl = provider.parseResponse(response.data);

            // Validate the shortened URL
            const isValid = provider.isValidShortUrl ? provider.isValidShortUrl(shortenUrl) : shortenUrl.startsWith('https://');

            if (!isValid) {
                // Looks like an error response (e.g., "Error, database insert failed")
                logger.warn(`${provider.name} returned error: ${shortenUrl} - trying next provider`);
                _shortenWithFallback(logger, imageUrl, providerIndex + 1, text, resolve);
                return;
            }

            logger.debug(`Successfully shortened URL with ${provider.name}: ${shortenUrl}`);
            resolve(`${text}${shortenUrl}`);
        })
        .catch(err => {
            const statusCode = err?.response?.status || 'N/A';
            const isCloudFlareChallenge = err?.response?.headers?.server?.includes('cloudflare') ||
                                         err?.response?.data?.includes?.('challenge');

            if (isCloudFlareChallenge) {
                logger.info(`${provider.name} blocked request (CloudFlare challenge) - trying next provider`);
            } else if (statusCode !== 'N/A') {
                logger.warn(`${provider.name} returned status ${statusCode} for URL shortening - trying next provider`);
            } else {
                logger.warn(`${provider.name} unavailable: ${err?.message} - trying next provider`);
            }

            // Try next provider
            _shortenWithFallback(logger, imageUrl, providerIndex + 1, text, resolve);
        });
};

/**
 * Build User-Agent string identifying botEnSky
 *
 * @private
 * @returns {string} User-Agent header value
 */
const _buildUserAgent = () => {
    return `botEnSky/${botVersion} (Bluesky bot; +https://github.com/boly38/botEnSky)`;
};
