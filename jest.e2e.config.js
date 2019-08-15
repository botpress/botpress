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
  testMatch: ['**/(src|test)/**/*.test.(ts|js)'],
  testPathIgnorePatterns: ['out', 'build', 'node_modules', 'modules', 'src/bp'],
  rootDir: '.'
}
