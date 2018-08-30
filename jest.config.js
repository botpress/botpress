const process = require('process')

module.exports = {
  globals: {
    'ts-jest': {
      tsConfigFile: '<rootDir>/tsconfig.json'
    }
  },
  collectCoverage: false,
  verbose: true,
  moduleFileExtensions: ['ts', 'js', 'tsx', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testMatch: ['**/(src|test)/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['dist', 'build'],
  testEnvironment: 'node',
  rootDir: process.cwd()
}
