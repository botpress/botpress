const path = require('path')

// Required in order for the Jest VS Code Extension to work properly
process.env.NATIVE_EXTENSIONS_DIR = '../../build/native-extensions'

module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.test.json',
      diagnostics: false
    }
  },
  setupFiles: ['<rootDir>/src/jest-before.ts'],
  globalSetup: '<rootDir>/src/jest-rewire.ts',
  setupFilesAfterEnv: [],
  collectCoverage: false,
  resetModules: true,
  verbose: true,
  modulePaths: ['<rootDir>/src/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'd.ts'],
  modulePathIgnorePatterns: ['out'],
  transform: {
    '^.+\\.(ts|tsx|js)$': 'ts-jest'
  },
  resolver: '<rootDir>/src/jest-resolver.js',
  moduleNameMapper: {
    '^botpress/sdk$': '<rootDir>/src/core/app/sdk_impl'
  },
  testMatch: ['**/(src|test)/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build', 'node_modules', 'e2e', '.*\\.u\\.test\\.(?:ts|js)'],
  testEnvironment: 'node',
  rootDir: '.',

  testResultsProcessor: '<rootDir>/../../node_modules/jest-html-reporter'
}
