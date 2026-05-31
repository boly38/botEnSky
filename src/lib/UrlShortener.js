/**
 * URL Shortener Service
 * 
 * Multi-provider URL shortening with fallback support
 *
 * Providers (in order of preference):
 * 1. tinyurl - No auth, unlimited quota, resilient to CloudFlare (primary)
 * 2. is.gd - DISABLED: Rejected by CloudFlare (see #201)
 * 3. v.gd - DISABLED: Rejected by CloudFlare (see #201)
 *
 * Features:
 * - Multiple provider support with automatic failover
 * - Provider enable/disable flag for easy maintenance
 * - User-Agent header identifying botEnSky
 * - Improved error logging with status codes and details
 * - CloudFlare challenge detection
 * - Fallback to full URL if all providers fail
 *
 * Official websites:
 * - https://tinyurl.com/
 * - https://is.gd/ (disabled)
 * - https://v.gd/ (disabled)
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
} catch {
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
 * - enabled: Boolean flag to enable/disable provider (for maintenance/rotation)
 * - buildUrl: Function to build the API URL
 * - parseResponse: Function to extract shortened URL from response
 * - isValidShortUrl: Function to validate the response (optional, checks if URL is valid)
 *
 * Providers:
 * - tinyurl: Free, no auth, resilient, NO Cloudflare issues (primary)
 * - is.gd: Free, no auth, direct 301 redirect (disabled due to CloudFlare rejection - see #201)
 * - v.gd: Free, no auth, compatible API (disabled due to CloudFlare rejection - see #201)
 */
const SHORTENER_PROVIDERS = [
    {
        name: 'tinyurl',
        enabled: true,
        buildUrl: (url) => `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
        parseResponse: (data) => data.trim(),
        isValidShortUrl: (shortUrl) => shortUrl.startsWith('https://tinyurl.com/'),
    },
    {
        name: 'is.gd',
        // DISABLED: Rejected by CloudFlare when called server-side (issue #201)
        enabled: false,
        buildUrl: (url) => `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
        parseResponse: (data) => data.trim(),
        isValidShortUrl: (shortUrl) => shortUrl.startsWith('https://is.gd/'),
    },
    {
        name: 'v.gd',
        // DISABLED: Rejected by CloudFlare when called server-side (issue #201)
        enabled: false,
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
     // Skip disabled providers
     let provider;
     let currentIndex = providerIndex;

     while (currentIndex < SHORTENER_PROVIDERS.length) {
         provider = SHORTENER_PROVIDERS[currentIndex];
         if (provider.enabled) {
             break; // Found an enabled provider
         }
         currentIndex++;
     }

     if (currentIndex >= SHORTENER_PROVIDERS.length || !provider?.enabled) {
         // All providers exhausted or disabled, fallback to full URL
         logger.info(`URL shortener unavailable for: ${imageUrl} - using full URL instead`);
         return resolve(`${text}${imageUrl}`);
    }

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
                _shortenWithFallback(logger, imageUrl, currentIndex + 1, text, resolve);
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
            _shortenWithFallback(logger, imageUrl, currentIndex + 1, text, resolve);
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
