const tsjPreset = require('ts-jest/presets').defaults

module.exports = {
  preset: 'jest-puppeteer',
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.test.json',
      isolatedModules: true
    }
  },
  globalSetup: 'jest-environment-puppeteer/setup',
  globalTeardown: 'jest-environment-puppeteer/teardown',
  setupFilesAfterEnv: ['<rootDir>/e2e/jest.setup.ts'],
  collectCoverage: false,
  resetModules: true,
  modulePaths: ['<rootDir>/src/bp/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  transform: {
    ...tsjPreset.transform
  },
  testMatch: ['**/e2e/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build', 'node_modules', 'src/bp'],
  rootDir: '.',
  testEnvironment: '<rootDir>/e2e/jest.environment.js',
  testResultsProcessor: '<rootDir>/../../node_modules/jest-html-reporter',
  testRunner: 'jest-circus/runner'
}
