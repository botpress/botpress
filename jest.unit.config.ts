import { Config } from '@jest/types'
import { defaults as tsjPreset } from 'ts-jest/presets'

// Required in order for the Jest VS Code Extension to work properly
process.env.NATIVE_EXTENSIONS_DIR = 'build/native-extensions'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  projects: [
    {
      rootDir: 'packages/bp/src',
      displayName: { name: 'botpress', color: 'green' },
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>../tsconfig.json'
        }
      },
      transform: {
        ...tsjPreset.transform
      },
      setupFiles: ['<rootDir>/jest-before.ts'],
      setupFilesAfterEnv: ['jest-extended/all'],
      globalSetup: '<rootDir>/jest-rewire.ts',
      resolver: '<rootDir>/jest-resolver.js',
      modulePaths: ['<rootDir>/'],
      moduleNameMapper: {
        '^botpress/sdk$': '<rootDir>/core/app/sdk_impl'
      },
      testPathIgnorePatterns: ['.*integration\\.test\\.(?:ts|js)'],
      testEnvironment: 'node'
    },
    {
      rootDir: './packages/ui-shared-lite',
      displayName: { name: 'ui-shared-lite', color: 'yellow' },
      clearMocks: true,
      testEnvironment: 'jsdom',
      transform: {
        ...tsjPreset.transform
      },
      modulePaths: ['<rootDir>/packages/ui-shared-lite/'],
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>../ui-shared/tsconfig.json'
        }
      }
    }
  ]
}

export default config
