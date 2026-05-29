import {describe, it} from "mocha";

describe('🧪🧪 00 - Before All', () => {
    it('should verify NODE_ENV is set', () => {
        const nodeEnv = process.env.NODE_ENV;
        if (!nodeEnv) {
            console.error('\n');
            console.error('❌ ERROR: NODE_ENV environment variable is not set!');
            console.error('');
            console.error('🔧 SOLUTION:');
            console.error('   Use the test-runner skill to run tests properly.');
            console.error('   See: .github/skills/test-runner/SKILL.md');
            console.error('');
            console.error('   Quick command:');
            console.error('   NODE_ENV=development pnpm test');
            console.error('');
            throw new Error('NODE_ENV must be set to run tests (use test-runner skill)');
        }
        console.log(`✅ NODE_ENV is set to: ${nodeEnv}`);
    });
});

