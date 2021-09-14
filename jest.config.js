const path = require('path')

// Required in order for the Jest VS Code Extension to work properly
process.env.NATIVE_EXTENSIONS_DIR = 'build/native-extensions'

module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/packages/bp/tsconfig.test.json',
      diagnostics: false
    }
  },
  setupFiles: ['<rootDir>/packages/bp/src/jest-before.ts'],
  globalSetup: '<rootDir>/packages/bp/src/jest-rewire.ts',
  setupFilesAfterEnv: [],
  collectCoverage: false,
  coverageReporters: ['text-summary'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/{node_modules,dist,out,e2e,build,docs,examples}/**',
    '!**/migrations/v*.ts',
    '!**/*.d.ts'
  ],
  resetModules: true,
  verbose: true,
  modulePaths: ['<rootDir>/packages/bp/src/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'd.ts'],
  modulePathIgnorePatterns: ['out'],
  transform: {
    '^.+\\.(ts|tsx|js)$': 'ts-jest'
  },
  resolver: '<rootDir>/packages/bp/src/jest-resolver.js',
  moduleNameMapper: {
    '^botpress/sdk$': '<rootDir>/packages/bp/src/core/app/sdk_impl'
  },
  testMatch: ['**/(src|test)/**/*.test.(ts|js)'],
  testPathIgnorePatterns: [
    'out',
    'build',
    'node_modules',
    'e2e',
    '.*\\.u\\.test\\.(?:ts|js)',
    '.*integration\\.test\\.(?:ts|js)'
  ],
  testEnvironment: 'node',
  rootDir: '.',

  testResultsProcessor: '<rootDir>/node_modules/jest-html-reporter'
}
