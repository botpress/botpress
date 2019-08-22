module.exports = {
  preset: 'jest-puppeteer',
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/src/tsconfig.test.json',
      isolatedModules: true
    }
  },
  collectCoverage: false,
  resetModules: true,
  modulePaths: ['<rootDir>/src/bp/'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  transform: {
    '^.+\\.(ts|tsx|js)$': 'ts-jest'
  },
  setupFilesAfterEnv: ['expect-puppeteer'],
  globalSetup: 'jest-environment-puppeteer/setup',
  testEnvironment: 'jest-environment-puppeteer',
  testMatch: ['**/src/e2e/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build', 'node_modules', 'src/bp'],
  rootDir: '.'
}
