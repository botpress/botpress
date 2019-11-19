module.exports = {
  preset: 'jest-puppeteer',
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/src/tsconfig.test.json',
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
  testMatch: ['**/src/e2e/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build', 'node_modules', 'src/bp'],
  testEnvironment: '<rootDir>/src/e2e/customEnvironment.js',
  rootDir: '.',
  testResultsProcessor: './node_modules/jest-html-reporter',
  testRunner: "jest-circus/runner",
}
