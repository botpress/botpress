import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import { Config } from '../config'

import { FileDefinition, FileTypes } from './definitions'
import { EditorError } from './editorError'
import { EditableFile, FilePermissions, FilesDS, FileType, TypingDefinitions } from './typings'
import { assertValidFilename, buildRestrictedProcessVars, getBuiltinExclusion, getFileLocation } from './utils'

export const FILENAME_REGEX = /^[0-9a-zA-Z_\-.]+$/
export const MAIN_GLOBAL_CONFIG_FILES = ['botpress.config.json', 'workspaces.json']

export default class Editor {
  private bp: typeof sdk
  private _botId: string
  private _typings: TypingDefinitions
  private _config: Config

  constructor(bp: typeof sdk, botId: string, config: Config) {
    this.bp = bp
    this._botId = botId
    this._config = config
  }

  async getAllFiles(permissions: FilePermissions): Promise<FilesDS> {
    const files: FilesDS = {}

    await Promise.mapSeries(Object.keys(permissions), async type => {
      const userPermissions = permissions[type]
      if (userPermissions.read) {
        files[type] = await this.loadFiles(userPermissions.type, !userPermissions.isGlobal && this._botId)
      }
    })

    const examples = await this._getExamples()
    files['action_example'] = examples.filter(x => x.type === 'action')
    files['hook_example'] = examples.filter(x => x.type === 'hook')

    return files
  }

  async fileExists(file: EditableFile): Promise<boolean> {
    const { folder, filename } = getFileLocation(file)
    return this._getGhost(file).fileExists(folder, filename)
  }

  async readFileContent(file: EditableFile): Promise<string> {
    const { folder, filename } = getFileLocation(file)
    return this._getGhost(file).readFileAsString(folder, filename)
  }

  async saveFile(file: EditableFile): Promise<void> {
    const shouldSyncToDisk = FileTypes[file.type].ghost.shouldSyncToDisk
    const { folder, filename } = getFileLocation(file)

    return this._getGhost(file).upsertFile(folder, filename, file.content, {
      syncDbToDisk: shouldSyncToDisk
    })
  }

  async loadFiles(fileTypeId: string, botId?: string): Promise<EditableFile[]> {
    const def: FileDefinition = FileTypes[fileTypeId]
    const { baseDir, dirListingAddFields } = def.ghost

    if ((!def.allowGlobal && !botId) || (!def.allowScoped && botId)) {
      return []
    }

    const excluded = this._config.includeBuiltin ? undefined : getBuiltinExclusion()
    const ghost = botId ? this.bp.ghost.forBot(botId) : this.bp.ghost.forGlobal()
    const files = def.filenames
      ? def.filenames
      : await ghost.directoryListing(baseDir, def.isJSON ? '*.json' : '*.js', excluded, true)

    return Promise.map(files, async (filepath: string) => ({
      name: path.basename(filepath),
      type: fileTypeId as FileType,
      location: filepath,
      content: undefined,
      botId,
      ...(dirListingAddFields && dirListingAddFields(filepath))
    }))
  }

  private async _getExamples(): Promise<EditableFile[]> {
    const files = await this.bp.ghost.forGlobal().directoryListing('/examples', '*.js')

    return Promise.map(files, async (filepath: string) => {
      const isHook = filepath.startsWith('examples/hooks')
      const location = filepath.replace('examples/actions/', '').replace('examples/hooks/', '')

      return {
        name: path.basename(filepath),
        type: (isHook ? 'hook' : 'action') as FileType,
        location,
        readOnly: true,
        isExample: true,
        content: await this.bp.ghost.forGlobal().readFileAsString('/examples', filepath),
        ...(isHook && { hookType: location.substr(0, location.indexOf('/')) })
      }
    })
  }

  private _getGhost(file: EditableFile): sdk.ScopedGhostService {
    return file.botId ? this.bp.ghost.forBot(this._botId) : this.bp.ghost.forGlobal()
  }

  async deleteFile(file: EditableFile): Promise<void> {
    const fileDef = FileTypes[file.type]
    if (fileDef.canDelete && !fileDef.canDelete(file)) {
      throw new Error('This file cannot be deleted.')
    }

    const { folder, filename } = getFileLocation(file)
    await this._getGhost(file).deleteFile(folder, filename)
  }

  async renameFile(file: EditableFile, newName: string): Promise<void> {
    assertValidFilename(newName)

    const { folder, filename } = getFileLocation(file)
    const newFilename = filename.replace(filename, newName)

    const ghost = this._getGhost(file)

    if (await ghost.fileExists(folder, newFilename)) {
      throw new EditorError('File already exists')
    }

    return ghost.renameFile(folder, filename, newFilename)
  }

  async loadTypings() {
    if (this._typings) {
      return this._typings
    }

    const sdkTyping = fs.readFileSync(path.join(__dirname, '/../botpress.d.js'), 'utf-8')
    const nodeTyping = fs.readFileSync(path.join(__dirname, `/../typings/node.d.js`), 'utf-8')
    // Ideally we should fetch them locally, but for now it's safer to bundle it
    const botSchema = fs.readFileSync(path.join(__dirname, '/../typings/bot.config.schema.json'), 'utf-8')
    const botpressConfigSchema = fs.readFileSync(
      path.join(__dirname, '/../typings/botpress.config.schema.json'),
      'utf-8'
    )

    // Required so array.includes() can be used without displaying an error
    const es6include = fs.readFileSync(path.join(__dirname, '/../typings/es6include.txt'), 'utf-8')

    const moduleTypings = await this.getModuleTypings()

    this._typings = {
      'process.d.ts': buildRestrictedProcessVars(),
      'node.d.ts': nodeTyping.toString(),
      'botpress.d.ts': sdkTyping.toString().replace(`'botpress/sdk'`, `sdk`),
      'bot.config.schema.json': botSchema.toString(),
      'botpress.config.schema.json': botpressConfigSchema.toString(),
      'es6include.d.ts': es6include.toString(),
      ...moduleTypings
    }

    return this._typings
  }

  async getModuleTypings() {
    const cwd = path.resolve(__dirname, '../../..')
    try {
      return _.reduce(
        fs.readdirSync(cwd),
        (result, dir) => {
          const pkgPath = path.join(cwd, dir, 'package.json')
          if (fs.existsSync(pkgPath)) {
            const moduleName = require(pkgPath).name
            const schemaPath = path.join(cwd, dir, 'assets/config.schema.json')
            result[`modules/${moduleName}/config.schema.json`] = fs.existsSync(schemaPath)
              ? fs.readFileSync(schemaPath, 'utf-8')
              : '{}'
          }
          return result
        },
        {}
      )
    } catch (e) {
      this.bp.logger.attachError(e).error('Error reading typings')
      return {}
    }
  }
}
