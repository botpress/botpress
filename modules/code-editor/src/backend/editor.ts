import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import { Config } from '../config'

import { FileDefinition, FileTypes } from './definitions'
import { EditorError } from './editorError'
import { EditableFile, FilePermissions, FilesDS, FileType, TypingDefinitions } from './typings'
import {
  assertValidFilename,
  buildRestrictedProcessVars,
  getBuiltinExclusion,
  getFileLocation,
  RAW_TYPE
} from './utils'

const RAW_FILES_FILTERS = ['**/*.map', 'modules/.cache/**/*', 'modules/*.cache', 'modules/*.temp_cache']

export default class Editor {
  private bp: typeof sdk
  private _botId: string
  private _typings: TypingDefinitions
  private _config: Config

  constructor(bp: typeof sdk, config: Config) {
    this.bp = bp
    this._config = config
  }

  forBot(botId: string) {
    this._botId = botId
    return this
  }

  async getAllFiles(permissions: FilePermissions, rawFiles?: boolean, listBuiltin?: boolean): Promise<FilesDS> {
    if (rawFiles && permissions['root.raw'].read) {
      return {
        raw: await this.loadRawFiles()
      }
    }

    const files: FilesDS = {}

    await Promise.mapSeries(Object.keys(permissions), async type => {
      const userPermissions = permissions[type]
      if (userPermissions.read) {
        files[type] = await this.loadFiles(userPermissions.type, !userPermissions.isGlobal && this._botId, listBuiltin)
      }
    })

    const examples = await this._getExamples()
    files['action_example'] = examples.filter(x => x.type === 'action_legacy')
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

  async readFileBuffer(file: EditableFile): Promise<Buffer> {
    const { folder, filename } = getFileLocation(file)
    return this._getGhost(file).readFileAsBuffer(folder, filename)
  }

  async saveFile(file: EditableFile): Promise<void> {
    const shouldSyncToDisk = FileTypes[file.type].ghost.shouldSyncToDisk
    const { folder, filename } = getFileLocation(file)

    return this._getGhost(file).upsertFile(folder, filename, file.content, {
      syncDbToDisk: shouldSyncToDisk
    })
  }

  async loadRawFiles(): Promise<EditableFile[]> {
    const files = await this.bp.ghost.forRoot().directoryListing('/', '*.*', RAW_FILES_FILTERS, true)

    return Promise.map(files, async (filepath: string) => ({
      name: path.basename(filepath),
      type: 'raw' as FileType,
      location: filepath,
      content: undefined
    }))
  }

  async loadFiles(fileTypeId: string, botId?: string, listBuiltin?: boolean): Promise<EditableFile[]> {
    const def: FileDefinition = FileTypes[fileTypeId]
    const { baseDir, dirListingAddFields, dirListingExcluded } = def.ghost

    if ((!def.allowGlobal && !botId) || (!def.allowScoped && botId)) {
      return []
    }

    let fileExt = '*.*'
    if (def.isJSON !== undefined) {
      fileExt = def.isJSON ? '*.json' : '*.js'
    }

    const baseExcluded = this._config.includeBuiltin || listBuiltin ? [] : getBuiltinExclusion()
    const excluded = [...baseExcluded, ...(dirListingExcluded ?? [])]

    const ghost = botId ? this.bp.ghost.forBot(botId) : this.bp.ghost.forGlobal()
    const files = def.filenames ? def.filenames : await ghost.directoryListing(baseDir, fileExt, excluded, true)

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
        type: (isHook ? 'hook' : 'action_legacy') as FileType,
        location,
        readOnly: true,
        isExample: true,
        content: await this.bp.ghost.forGlobal().readFileAsString('/examples', filepath),
        ...(isHook && { hookType: location.substr(0, location.indexOf('/')) })
      }
    })
  }

  private _getGhost(file: EditableFile): sdk.ScopedGhostService {
    if (file.type === RAW_TYPE) {
      return this.bp.ghost.forRoot()
    }
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

  async readFile(name: string, filePath: string) {
    let fileContent = ''
    try {
      const typings = fs.readFileSync(filePath, 'utf-8')

      fileContent = typings.toString()
      if (name === 'botpress.d.ts') {
        fileContent = fileContent.replace("'botpress/sdk'", 'sdk')
      }
    } catch (err) {
      this.bp.logger.warn(`Couldn't load file ${filePath} `)
    }

    return { name, fileContent }
  }

  async loadTypings() {
    if (this._typings) {
      return this._typings
    }

    const ghost = this.bp.ghost.forRoot()
    const botConfigSchema = await ghost.readFileAsString('/', 'bot.config.schema.json')
    const botpressConfigSchema = await ghost.readFileAsString('/', 'botpress.config.schema.json')

    const moduleTypings = await this.getModuleTypings()

    const files = [
      { name: 'node.d.ts', location: path.join(__dirname, '/../typings/node.d.txt') },
      { name: 'botpress.d.ts', location: path.join(__dirname, '/../botpress.d.js') },
      // Required so array.includes() can be used without displaying an error
      { name: 'es6include.d.ts', location: path.join(__dirname, '/../typings/es6include.txt') }
    ]

    const content = await Promise.mapSeries(files, file => this.readFile(file.name, file.location))
    const localTypings = _.mapValues(_.keyBy(content, 'name'), 'fileContent')

    this._typings = {
      'process.d.ts': buildRestrictedProcessVars(),
      'bot.config.schema.json': botConfigSchema,
      'botpress.config.schema.json': botpressConfigSchema,
      ...localTypings,
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
