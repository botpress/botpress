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
  testMatch: ['<rootDir>/test/**/*.test.(ts|js)'],
  testEnvironment: 'node',
  rootDir: process.cwd()
}
