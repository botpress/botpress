import type { Config } from '@jest/types'
import { defaults as tsjPreset } from 'ts-jest/presets'

const config: Config.InitialOptions = {
  rootDir: 'packages/bp/e2e',
  preset: 'jest-puppeteer',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>../tsconfig.test.json'
    }
  },
  transform: {
    ...tsjPreset.transform
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  globalSetup: 'jest-environment-puppeteer/setup',
  globalTeardown: 'jest-environment-puppeteer/teardown',
  collectCoverage: false,
  resetModules: true,
  modulePaths: ['<rootDir>../src/bp/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  testMatch: ['**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build', 'node_modules', 'src/bp'],
  testEnvironment: '<rootDir>/jest.environment.ts',
  testResultsProcessor: '<rootDir>/../../../node_modules/jest-html-reporter',
  testRunner: 'jest-circus/runner'
}

export default config
