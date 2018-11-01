module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.json'
    }
  },
  setupFiles: ['<rootDir>/bp/import-rewire.ts'],
  collectCoverage: false,
  verbose: true,
  modulePaths: ['<rootDir>/bp/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleNameMapper: {
    '^botpress/sdk$': '<rootDir>/bp/core/sdk_impl'
  },
  testMatch: ['**/(src|test)/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build'],
  testEnvironment: 'node',
  rootDir: 'src',
  preset: 'ts-jest',
  testResultsProcessor: '../node_modules/jest-html-reporter'
}
