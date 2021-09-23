const tsjPreset = require('ts-jest/presets')

module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    ...tsjPreset.transform
  },
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>../ui-shared/tsconfig.json',
      diagnostics: false
    }
  }
}
