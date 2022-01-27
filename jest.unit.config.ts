import { Config } from '@jest/types'
import { defaults as tsjPreset } from 'ts-jest/presets'
import { pathsToModuleNameMapper } from 'ts-jest'
const ServerConfig = require('./packages/bp/tsconfig.test.json')

// Required in order for the Jest VS Code Extension to work properly
process.env.NATIVE_EXTENSIONS_DIR = 'build/native-extensions'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  projects: [
    {
      rootDir: 'packages/bp',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      displayName: { name: 'botpress', color: 'green' },
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/tsconfig.test.json'
        }
      },
      transform: {
        ...tsjPreset.transform
      },
      setupFiles: ['<rootDir>src/jest-before.ts'],
      setupFilesAfterEnv: ['jest-extended/all'],
      globalSetup: '<rootDir>src/jest-rewire.ts',
      resolver: '<rootDir>src/jest-resolver.js',
      modulePaths: ['<rootDir>/src'],
      moduleNameMapper: {
        // The order is important!
        // Note that the prefix path is weird because of the baseUrl option in the tsconfig
        ...pathsToModuleNameMapper(ServerConfig.compilerOptions.paths, { prefix: '<rootDir>/runtime' }),
        '^botpress/runtime-sdk$': '<rootDir>../runtime/src/runtime/app/sdk_impl',
        '^botpress/sdk$': '<rootDir>src/core/app/sdk_impl'
      },
      testPathIgnorePatterns: ['.*integration\\.test\\.(?:ts|js)'],
      testEnvironment: 'node'
    },
    {
      rootDir: 'packages/runtime/src',
      displayName: { name: 'runtime', color: 'blue' },
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
      modulePaths: ['<rootDir>', '<rootDir>../../bp/src'],
      moduleNameMapper: {
        '^botpress/runtime-sdk$': '<rootDir>/runtime/app/sdk_impl',
        '^botpress/sdk$': '<rootDir>/../../bp/src/core/app/sdk_impl'
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
