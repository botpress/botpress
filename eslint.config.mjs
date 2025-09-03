import importPlugin from 'eslint-plugin-import';
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin'

// import oxlint from 'eslint-plugin-oxlint';
// import path from "path"
// const oxlintFile = path.join(import.meta.dirname, '.oxlintrc.json');
// const oxlintRules = oxlint.buildFromOxlintConfigFile(oxlintFile)
//     .map(config => config.rules)
//     .reduce((acc, rules) => ({ ...acc, ...rules }), {})

// console.log(JSON.stringify(oxlintRules, null, 2))

const ignores = [
    ".git/",
    "**/*.{d.ts,test.ts,js,cjs,mjs,jsx}",
    "**/cdk.out/",
    "**/dist/",
    "node_modules/",
    "**/node_modules/",
    "**/bp_modules/",
    "**/.botpress/",
    "**/gen/",
    "**/.turbo/",
    "**/.genenv/",
    "**/.ignore.me.*",
    "**/*.md.ts",
    "packages/llmz/examples/"
];

export default [{
    ignores,
    // ^  DO NOT REMOVE THIS LINE - this is necessary for the ignores
    // pattern to be treated as a "global ignores"
}, {
    ignores,
    files: ["**/*.{ts,tsx}"],
    plugins: {
        jsdoc,
        '@stylistic': stylistic,
        "@typescript-eslint": tseslint.plugin,
        prettier,
        import: importPlugin
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "commonjs",

        parserOptions: {
            project: ["./tsconfig.json"],
            tsconfigRootDir: import.meta.dirname,
        },
    },

    rules: {
        ...prettier.configs.recommended.rules,

        complexity: ["off"],
        "prefer-const": "warn",

        "@stylistic/member-delimiter-style": ["error", {
            multiline: {
                delimiter: "none",
                requireLast: true,
            },

            singleline: {
                delimiter: "semi",
                requireLast: false,
            },
        }],

        "@stylistic/quotes": ["error", "single", {
            avoidEscape: true,
        }],

        "@typescript-eslint/no-floating-promises": ["error", {
            checkThenables: true
        }],
        "@typescript-eslint/no-misused-promises": "error",
        "@stylistic/semi": ["error", "never"],
        "@stylistic/type-annotation-spacing": "error",
        "@stylistic/brace-style": "off",
        "@stylistic/eol-last": "error",
        "@typescript-eslint/no-shadow": "off",

        "import/order": ["warn", {
            groups: [["builtin", "external"], "parent", "index", "sibling"],
            // TODO: Eventually enable this in the future for consistency
            // 'newlines-between': 'always',
            alphabetize: {
                order: "asc",
                caseInsensitive: true,
            },

            pathGroupsExcludedImportTypes: ["builtin"],
        }],

        "jsdoc/check-alignment": "error",
        "@stylistic/linebreak-style": ["error", "unix"],
        "@stylistic/no-trailing-spaces": "error",
        "object-shorthand": "error",

        "@typescript-eslint/naming-convention": ["warn", {
            selector: "memberLike",
            modifiers: ["private"],
            format: ["camelCase"],
            leadingUnderscore: "require",
        }],

        "@typescript-eslint/explicit-member-accessibility": "warn",

        // Disable every rule already covered by oxlint
        "no-console": "off",
        "no-cond-assign": "off",
        "no-const-assign": "off",
        "no-debugger": "off",
        "no-sparse-arrays": "off",
        "default-case": "off",
        "default-case-last": "off",
        "no-eval": "off",
        "no-return-assign": "off",
        "no-var": "off",
        "no-duplicate-imports": "off",
        "@typescript-eslint/consistent-type-definitions": "off",
        "@typescript-eslint/prefer-namespace-keyword": "off",
        "eqeqeq": "off",
        "unicorn/no-empty-file": "off",
        "unicorn/no-lonely-if": "off",
    },
}];
