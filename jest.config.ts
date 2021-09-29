import type { InitialOptionsTsJest } from 'ts-jest/dist/types'
import { defaults as tsjPreset } from 'ts-jest/presets'

// Required in order for the Jest VS Code Extension to work properly
process.env.NATIVE_EXTENSIONS_DIR = 'build/native-extensions'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  projects: [
    {
      displayName: 'botpress',
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>../tsconfig.test.json',
          diagnostics: false
        }
      },
      setupFiles: ['<rootDir>/jest-before.ts'],
      globalSetup: '<rootDir>/jest-rewire.ts',
      resetModules: true,
      modulePaths: ['<rootDir>/'],
      moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'd.ts'],
      modulePathIgnorePatterns: ['out'],
      transform: {
        ...tsjPreset.transform,
      },
      resolver: '<rootDir>/jest-resolver.js',
      moduleNameMapper: {
        '^botpress/sdk$': '<rootDir>/core/app/sdk_impl'
      },
      testMatch: ['**/(src|test)/**/*.test.(ts|js)'],
      testPathIgnorePatterns: [
        'out',
        'build',
        'node_modules',
        'e2e',
        '.*\\.u\\.test\\.(?:ts|js)',
        '.*integration\\.test\\.(?:ts|js)'
      ],
      testEnvironment: 'node',
      rootDir: 'packages/bp/src'
    },
    {
      displayName: 'ui-shared-lite',
      clearMocks: true,
      testEnvironment: 'jsdom',
      transform: {
        ...tsjPreset.transform
      },
      rootDir: './packages/ui-shared-lite/',
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