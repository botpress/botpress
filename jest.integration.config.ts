import { Config } from '@jest/types'
import { defaults as tsjPreset } from 'ts-jest/presets'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  projects: [
    {
      rootDir: 'packages/bp/src',
      displayName: { name: 'botpress', color: 'blue' },
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>../tsconfig.json'
        }
      },
      modulePaths: ['<rootDir>/'],
      transform: {
        ...tsjPreset.transform
      },
      moduleNameMapper: {
        '^botpress/sdk$': '<rootDir>/core/app/sdk_impl'
      },
      testMatch: ['**/(src|test)/**/*.integration.test.(ts|js)'],
      testEnvironment: 'node'
    },
    {
      rootDir: 'modules',
      displayName: { name: 'modules', color: 'red' },
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>../packages/bp/tsconfig.json',
          diagnostics: false
        }
      },
      modulePaths: ['<rootDir>/../packages/bp/src'],
      transform: {
        ...tsjPreset.transform
      },
      moduleNameMapper: {
        '^botpress/sdk$': '<rootDir>/../packages/bp/src/core/app/sdk_impl'
      },
      testMatch: ['**/(src|test)/**/*.integration.test.(ts|js)'],
      testEnvironment: 'node'
    }
  ]
}

export default config
