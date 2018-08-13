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
<<<<<<< HEAD
  testMatch: ['**/(src|test)/**/*.test.(ts|js)'],
=======
  testMatch: ['**/src/**/*.test.(ts|js)'],
>>>>>>> fix: support tests outside test folder
  testPathIgnorePatterns: ['dist'],
  testEnvironment: 'node',
  rootDir: process.cwd()
}
