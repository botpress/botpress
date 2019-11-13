import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import { Config } from '../config'

import { FileDefinition, FileTypes } from './definitions'
import { EditorError } from './editorError'
import { EditableFile, FilePermissions, FilesDS, FileType, TypingDefinitions } from './typings'
import { assertValidFilename, buildRestrictedProcessVars, filterBuiltin, getFileLocation } from './utils'

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
        const loadedFiles = await this.loadFiles(userPermissions.type, !userPermissions.isGlobal && this._botId)
        files[type] = this._config.includeBuiltin ? loadedFiles : filterBuiltin(loadedFiles)
      }
    })

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

    const ghost = botId ? this.bp.ghost.forBot(botId) : this.bp.ghost.forGlobal()
    const files = def.filenames
      ? def.filenames
      : await ghost.directoryListing(baseDir, def.isJSON ? '*.json' : '*.js', undefined, true)

    return Promise.map(files, async (filepath: string) => ({
      name: path.basename(filepath),
      type: fileTypeId as FileType,
      location: filepath,
      // When not including builtin files, we need to read all of them to filter
      content: !this._config.includeBuiltin ? await ghost.readFileAsString(baseDir, filepath) : undefined,
      botId,
      ...(dirListingAddFields && dirListingAddFields(filepath))
    }))
  }

  private _getGhost(file: EditableFile): sdk.ScopedGhostService {
    return file.botId ? this.bp.ghost.forBot(this._botId) : this.bp.ghost.forGlobal()
  }

  async deleteFile(file: EditableFile): Promise<void> {
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

    this._typings = {
      'process.d.ts': buildRestrictedProcessVars(),
      'node.d.ts': nodeTyping.toString(),
      'botpress.d.ts': sdkTyping.toString().replace(`'botpress/sdk'`, `sdk`),
      'bot.config.schema.json': botSchema.toString(),
      'botpress.config.schema.json': botpressConfigSchema.toString()
    }

    return this._typings
  }
}
