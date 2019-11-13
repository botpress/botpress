import { HOOK_SIGNATURES } from '../typings/hooks'

import { MAIN_GLOBAL_CONFIG_FILES } from './editor'
import { EditableFile } from './typings'

export interface FileDefinition {
  allowGlobal?: boolean // When true, this type of file can be stored as global
  allowScoped?: boolean // When true, this file can be scoped to a specific bot
  isJSON?: boolean // When true, the file content is checked for valid JSON (also used for listing files in ghost)
  permission: string // The permission required for this type of file (will be prepended by global / bot)
  filenames?: string[] // List of valid filenames. Used for validation before save (& avoid doing a full directory listing)
  ghost: {
    baseDir: string // The base directory where files are located
    /** Adds additional fields to the resulting object when reading content from the disk */
    dirListingAddFields?: (filepath: string) => object | undefined
    upsertLocation?: (file: EditableFile) => string
    upsertFilename?: (file: EditableFile) => string
    shouldSyncToDisk?: boolean
  }
  /** An additional validation that must be done for that type of file. Return a string indicating the error message */
  validate?: (file: EditableFile) => Promise<string | undefined>
}

export const FileTypes: { [type: string]: FileDefinition } = {
  action: {
    allowGlobal: true,
    allowScoped: true,
    permission: 'actions',
    ghost: {
      baseDir: '/actions'
    }
  },
  hook: {
    allowGlobal: true,
    allowScoped: false,
    permission: 'hooks',
    ghost: {
      baseDir: '/hooks',
      dirListingAddFields: (filepath: string) => ({ hookType: filepath.substr(0, filepath.indexOf('/')) }),
      upsertLocation: (file: EditableFile) => `/hooks/${file.hookType}`,
      upsertFilename: (file: EditableFile) => file.location.replace(file.hookType, '')
    },
    validate: async (file: EditableFile) => {
      return HOOK_SIGNATURES[file.hookType] === undefined && `Invalid hook type "${file.hookType}"`
    }
  },
  bot_config: {
    allowGlobal: false,
    allowScoped: true,
    isJSON: true,
    permission: 'bot_config',
    filenames: ['bot.config.json'],
    ghost: {
      baseDir: '/'
    }
  },
  main_config: {
    allowGlobal: true,
    allowScoped: false,
    isJSON: true,
    permission: 'main_config',
    filenames: ['botpress.config.json', 'workspaces.json'],
    ghost: {
      baseDir: '/'
    },
    validate: async (file: EditableFile) => {
      return !MAIN_GLOBAL_CONFIG_FILES.includes(file.location) && 'Invalid file name'
    }
  },
  module_config: {
    allowGlobal: true,
    allowScoped: true,
    isJSON: true,
    permission: 'module_config',
    ghost: {
      baseDir: '/config'
    }
  }
}
