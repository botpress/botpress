const tsjPreset = require('ts-jest/presets').defaults
const tsPreset = require('ts-jest/jest-preset')
const puppeteerPreset = require('jest-puppeteer/jest-preset')

module.exports = {
  ...tsPreset,
  ...puppeteerPreset,
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverage: false,
  resetModules: true,
  modulePaths: ['<rootDir>../src/bp/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  testMatch: ['**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build', 'node_modules', 'src/bp'],
  rootDir: '.',
  testEnvironment: '<rootDir>/jest.environment.js',
  testResultsProcessor: '<rootDir>/../../../node_modules/jest-html-reporter',
  testRunner: 'jest-circus/runner'
}
