import { BOT_SCOPED_HOOKS, HOOK_SIGNATURES } from '../typings/hooks'

import { EditableFile } from './typings'

export const MAIN_GLOBAL_CONFIG_FILES = ['botpress.config.json', 'workspaces.json']

export interface FileDefinition {
  allowGlobal?: boolean // When true, this type of file can be stored as global
  allowScoped?: boolean // When true, this file can be scoped to a specific bot
  allowRoot?: boolean // When true, it can be accessed through the root scope
  onlySuperAdmin?: boolean //
  isJSON?: boolean // When true, the file content is checked for valid JSON (also used for listing files in ghost)
  permission: string // The permission required for this type of file (will be prepended by global / bot)
  filenames?: string[] // List of valid filenames. Used for validation before save (& avoid doing a full directory listing)
  ghost: {
    baseDir: string // The base directory where files are located
    /** Adds additional fields to the resulting object when reading content from the disk */
    dirListingAddFields?: (filepath: string) => object | undefined
    dirListingExcluded?: string[]
    upsertLocation?: (file: EditableFile) => string
    upsertFilename?: (file: EditableFile) => string
    shouldSyncToDisk?: boolean
  }
  /** Validation if the selected file can be deleted */
  canDelete?: (file: EditableFile) => boolean
  /** An additional validation that must be done for that type of file. Return a string indicating the error message */
  validate?: (file: EditableFile, isWriting?: boolean) => Promise<string | undefined>
}

export const FileTypes: { [type: string]: FileDefinition } = {
  action_http: {
    allowGlobal: false,
    allowScoped: true,
    permission: 'actions',
    ghost: {
      baseDir: '/actions',
      shouldSyncToDisk: true,
      upsertFilename: (file: EditableFile) => file.location.replace('.js', '.http.js')
    }
  },
  action_legacy: {
    allowGlobal: true,
    allowScoped: true,
    permission: 'actions',
    ghost: {
      baseDir: '/actions',
      shouldSyncToDisk: true
    }
  },
  hook: {
    allowGlobal: true,
    allowScoped: true,
    permission: 'hooks',
    ghost: {
      baseDir: '/hooks',
      dirListingAddFields: (filepath: string) => ({ hookType: filepath.substr(0, filepath.indexOf('/')) }),
      upsertLocation: (file: EditableFile) => `/hooks/${file.hookType}`,
      upsertFilename: (file: EditableFile) => file.location.replace(`${file.hookType}/`, ''),
      shouldSyncToDisk: true
    },
    validate: async (file: EditableFile, isWriting?: boolean) => {
      if (isWriting && file.botId && !BOT_SCOPED_HOOKS.includes(file.hookType)) {
        return "This hook can't be scoped to a bot"
      }
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
    },
    canDelete: () => false
  },
  shared_libs: {
    allowGlobal: false,
    allowScoped: true,
    permission: 'shared_libs',
    ghost: {
      dirListingExcluded: ['node_modules'],
      baseDir: '/libraries',
      shouldSyncToDisk: true
    },
    canDelete: file => {
      return !['package.json', 'package-lock.json'].includes(file.name)
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
    validate: async (file: EditableFile) => !MAIN_GLOBAL_CONFIG_FILES.includes(file.location) && 'Invalid file name',
    canDelete: () => false
  },
  module_config: {
    allowGlobal: true,
    allowScoped: true,
    isJSON: true,
    permission: 'module_config',
    ghost: {
      baseDir: '/config'
    },
    canDelete: (file: EditableFile) => !!file.botId
  },
  raw: {
    allowRoot: true,
    onlySuperAdmin: true,
    permission: 'raw',
    ghost: {
      baseDir: '/'
    }
  }
}
