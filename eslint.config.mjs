import importPlugin from 'eslint-plugin-import'
import jsdoc from 'eslint-plugin-jsdoc'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import tseslint from 'typescript-eslint'
import oxlint from 'eslint-plugin-oxlint'
import path from 'path'

const oxlintFile = path.join(import.meta.dirname, '.oxlintrc.json')

const ignores = [
  '.git/',
  '**/*.{d.ts,test.ts,js,cjs,mjs,jsx}',
  '**/cdk.out/',
  '**/dist/',
  'node_modules/',
  '**/node_modules/',
  '**/bp_modules/',
  '**/.botpress/',
  '**/.adk/',
  '**/gen/',
  '**/.turbo/',
  '**/.genenv/',
  '**/.ignore.me.*',
  '**/*.md.ts',
]

const oxlintRules = oxlint
  .buildFromOxlintConfigFile(oxlintFile)
  .map((config) => config.rules)
  .reduce((acc, rules) => ({ ...acc, ...rules }), {})

export default [
  {
    ignores,
    // ^  DO NOT REMOVE THIS LINE - this is necessary for the ignores
    // pattern to be treated as a "global ignores"
  },
  {
    ignores,
    files: ['**/*.{ts,tsx}'],
    plugins: {
      jsdoc,
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'commonjs',

      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          checkThenables: true,
        },
      ],
      '@typescript-eslint/no-misused-promises': 'error',
      'jsdoc/check-alignment': 'error',
      'object-shorthand': 'error',
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'memberLike',
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': 'warn',
      'import/no-unresolved': 'off',
      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external'], 'parent', 'index', 'sibling'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },

          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],

      // Disable every rule already covered by oxlint:
      ...oxlintRules,
    },
  },
]
