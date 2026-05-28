import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * CreditsService - Manages credits data for projects and services
 */
export default class CreditsService {
    constructor(loggerService) {
        this.logger = loggerService.getLogger().child({ label: 'CreditsService' });
        this.credits = this._loadCredits();
    }

    /**
     * Load credits from JSON file
     * @private
     * @returns {Array} Credits data sorted alphabetically
     */
    _loadCredits() {
        try {
            const creditsPath = join(__dirname, '../data/credits.json');
            const data = JSON.parse(readFileSync(creditsPath, 'utf8'));
            return data.credits.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            this.logger.error('Failed to load credits', { error: error.message });
            return [];
        }
    }

    /**
     * Get all credits
     * @returns {Array} All credits sorted alphabetically
     */
    getAllCredits() {
        return this.credits;
    }

    /**
     * Get credits by type
     * @param {String} type - Type filter (service, library, tool, runtime)
     * @returns {Array} Filtered credits
     */
    getCreditsByType(type) {
        return this.credits.filter(credit => credit.type === type);
    }

    /**
     * Get formatted credits for display
     * @returns {Object} Credits grouped by type
     */
    getFormattedCredits() {
        const grouped = {
            services: this.getCreditsByType('service'),
            libraries: this.getCreditsByType('library'),
            tools: this.getCreditsByType('tool'),
            runtimes: this.getCreditsByType('runtime')
        };
        return grouped;
    }
}

