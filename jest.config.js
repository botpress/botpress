const process = require('process')
const path = require('path')

const rootDir = path.join(process.cwd(), 'src')

module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.json'
    }
  },
  collectCoverage: false,
  verbose: true,
  modulePaths: ['<rootDir>/bp/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testMatch: ['**/(src|test)/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build'],
  testEnvironment: 'node',
  rootDir: 'src',
  preset: 'ts-jest'
}
