const path = require('path')

// Required in order for the Jest VS Code Extension to work properly
process.env.NATIVE_EXTENSIONS_DIR = './build/native-extensions'

module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/src/tests/tsconfig.test.json',
      diagnostics: false
    }
  },
  setupFiles: ['<rootDir>/src/tests/jest-before.ts'],
  globalSetup: '<rootDir>/src/tests/jest-rewire.ts',
  setupFilesAfterEnv: [],
  collectCoverage: false,
  resetModules: true,
  verbose: true,
  modulePaths: ['<rootDir>/src/bp/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  modulePathIgnorePatterns: ['out'],
  transform: {
    '^.+\\.(ts|tsx|js)$': 'ts-jest'
  },
  resolver: '<rootDir>/src/tests/jest-resolver.js',
  moduleNameMapper: {
    '^botpress/sdk$': '<rootDir>/src/bp/core/app/sdk_impl'
  },
  testMatch: ['**/(src|test)/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build', 'node_modules', 'e2e'],
  testEnvironment: 'node',
  rootDir: '../',

  testResultsProcessor: './node_modules/jest-html-reporter'
}
