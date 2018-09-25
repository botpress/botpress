const process = require('process')
const path = require('path')

let rootDir = process.cwd()

if (path.resolve(rootDir) === __dirname) {
  console.warn("You can't run tests from the root. Running Core tests instead.")
  rootDir = path.join(__dirname, 'src/bp')
}

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
  rootDir
}
