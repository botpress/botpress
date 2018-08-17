const process = require('process')

module.exports = {
  globals: {
    'ts-jest': {
      tsConfigFile: '<rootDir>/tsconfig.json'
    }
  },
  moduleFileExtensions: ['ts', 'js', 'tsx', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testMatch: ['**/(src|test)/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['dist'],
  testEnvironment: 'node',
  rootDir: process.cwd()
}
