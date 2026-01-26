// https://eslint.org/docs/latest
import js from "@eslint/js";
import globals from "globals";
import stylisticJs from '@stylistic/eslint-plugin-js'

export default [
    {
        "ignores": [
            "src/www/public/js/**", // Browser-side JS files
            "node_modules/**"
        ]
    },
    js.configs.recommended, // Recommended config applied to all files
    {
        "files": ["**/*.js"],
        "languageOptions": {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.node,
                "process": true
            },
            "parserOptions": {
                "sourceType": "module",
                "allowImportExportEverywhere": true
            },
        },
        plugins: {
            '@stylistic/js': stylisticJs
        },
        "rules": {
            '@stylistic/js/no-extra-semi': "error", /* to match houndci : https://eslint.org/docs/latest/rules/no-extra-semi */
        }
    }
];