module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/src/tsconfig.json'
    }
  },
  setupFiles: ['<rootDir>/src/bp/import-rewire.ts'],
  collectCoverage: false,
  verbose: true,
  modulePaths: ['<rootDir>/src/bp/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
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
