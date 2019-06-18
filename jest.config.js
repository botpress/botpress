const path = require('path')

module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/src/tsconfig.test.json'
    }
  },
  setupFiles: ['<rootDir>/src/bp/jest-before.ts'],
  globalSetup: '<rootDir>/src/bp/jest-rewire.ts',
  setupFilesAfterEnv: [],
  collectCoverage: false,
  resetModules: true,
  verbose: true,
  modulePaths: ['<rootDir>/src/bp/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  transform: {
    '^.+\\.(ts|tsx|js)$': 'ts-jest'
  },
  resolver: '<rootDir>/src/bp/jest-resolver.js',
  moduleNameMapper: {
    '^botpress/sdk$': '<rootDir>/src/bp/core/sdk_impl'
  },
  testMatch: ['**/(src|test)/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build', 'node_modules'],
  testEnvironment: 'node',
  rootDir: '.',
  preset: 'ts-jest',
  testResultsProcessor: './node_modules/jest-html-reporter'
}
