module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: ['prettier', 'prettier/@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [
      './src/tsconfig.json',
      './src/bp/ui-*/tsconfig.json',
      './modules/tsconfig*.eslint.json',
      './build/module-builder/tsconfig.json'
    ],
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  ignorePatterns: ['**/*.d.ts', '**/*.test.ts', '*.js'],
  plugins: ['eslint-plugin-import', 'eslint-plugin-jsdoc', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/consistent-type-definitions': 'error',
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'none',
          requireLast: true
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false
        }
      }
    ],
    // TODO: Change to error eventually
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    '@typescript-eslint/quotes': [
      // TODO: Change to error eventually
      'warn',
      'single',
      {
        avoidEscape: true
      }
    ],
    '@typescript-eslint/semi': ['error', 'never'],
    '@typescript-eslint/type-annotation-spacing': 'error',
    'brace-style': ['error', '1tbs'],
    curly: 'error',
    'eol-last': 'error',
    // TODO: Eventually change this to error
    eqeqeq: ['warn', 'smart'],
    'import/order': [
      'warn',
      {
        groups: [['builtin', 'external'], 'parent', 'index', 'sibling'],
        // TODO: Eventually enable this in the future for consistency
        // 'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        },
        pathGroups: [
          {
            pattern: '~/**',
            group: 'external',
            position: 'after'
          }
        ],
        pathGroupsExcludedImportTypes: ['builtin']
      }
    ],
    'jsdoc/check-alignment': 'error',
    'linebreak-style': ['error', 'unix'],
    'no-console': [
      'warn',
      {
        allow: [
          'warn',
          'dir',
          'time',
          'timeEnd',
          'timeLog',
          'trace',
          'assert',
          'clear',
          'count',
          'countReset',
          'group',
          'groupEnd',
          'table',
          'debug',
          'info',
          'dirxml',
          'error',
          'groupCollapsed',
          'Console',
          'profile',
          'profileEnd',
          'timeStamp',
          'context'
        ]
      }
    ],
    // TODO: Change this to error once fixed everywhere
    'no-duplicate-imports': 'warn',
    'no-return-await': 'error',
    'no-trailing-spaces': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-const': 'warn'
  }
}
