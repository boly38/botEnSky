import dotEnvFlow from 'dotenv-flow';
import fs from 'fs';

//~ project init of environment
export const initEnv = () => {
    if (!fs.existsSync('./env/.env.development') && !fs.existsSync('./env/.env.production')) {
        console.log('🔌 Environment must be configured inline');
    } else {
        dotEnvFlow.config({ path: './env/' });
    }
    if (!process.env.BLUESKY_USERNAME) {
        console.error('❌ BLUESKY_USERNAME environment variable is required');
        process.exit(1);
    }
}
