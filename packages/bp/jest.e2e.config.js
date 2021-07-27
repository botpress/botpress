module.exports = {
  preset: 'jest-puppeteer',
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.test.json',
      isolatedModules: true
    }
  },
  globalSetup: 'jest-environment-puppeteer/setup',
  setupFilesAfterEnv: ['expect-puppeteer', './jest.setup.js'],
  collectCoverage: false,
  resetModules: true,
  modulePaths: ['<rootDir>/src/bp/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  transform: {
    '^.+\\.(ts|tsx|js)$': 'ts-jest'
  },
  testMatch: ['**/e2e/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build', 'node_modules', 'src/bp'],
  testEnvironment: '<rootDir>/e2e/customEnvironment.js',
  rootDir: '.',
  testResultsProcessor: '<rootDir>/../../node_modules/jest-html-reporter',
  testRunner: 'jest-circus/runner'
}
