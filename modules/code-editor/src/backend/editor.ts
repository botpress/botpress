import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import { Config } from '../config'
import { HOOK_SIGNATURES } from '../typings/hooks'

import { EditorError, EditorErrorStatus } from './editorError'
import { EditableFile, FilePermissions, FilesDS, FileType, TypingDefinitions } from './typings'

const FILENAME_REGEX = /^[0-9a-zA-Z_\-.]+$/
const ALLOWED_TYPES = ['hook', 'action', 'bot_config', 'global_config', 'module_config']

const MAIN_GLOBAL_CONFIG_FILES = ['botpress.config.json', 'workspaces.json']

class WritePermissionError extends Error {
  readonly type = WritePermissionError.name
}

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

  getConfig(): Config {
    return this._config
  }

  async getAllFiles(permissions: FilePermissions): Promise<FilesDS> {
    return {
      actionsGlobal: await this.getGlobalActions(permissions),
      hooksGlobal: await this.getHooks(permissions),
      actionsBot: await this.getScopedActions(permissions),
      configsGlobal: await this.getGlobalConfigs(permissions),
      configsBot: await this.getScopedConfigs(permissions)
    }
  }

  private async getGlobalActions(permissions: FilePermissions): Promise<EditableFile[] | undefined> {
    const { readPermissions, writePermissions } = permissions
    return readPermissions.globalActions
      ? this._filterBuiltin(await this._loadActions(!writePermissions.globalActions))
      : undefined
  }

  private async getHooks(permissions: FilePermissions): Promise<EditableFile[] | undefined> {
    const { readPermissions, writePermissions } = permissions
    return readPermissions.hooks
      ? readPermissions.hooks && this._filterBuiltin(await this._loadHooks(!writePermissions.hooks))
      : undefined
  }

  private async getScopedActions(permissions: FilePermissions): Promise<EditableFile[] | undefined> {
    const { readPermissions, writePermissions } = permissions

    return readPermissions.botActions
      ? this._filterBuiltin(await this._loadActions(!writePermissions.botActions, this._botId))
      : undefined
  }

  private async getGlobalConfigs(permissions: FilePermissions): Promise<EditableFile[] | undefined> {
    const { readPermissions, writePermissions } = permissions
    return readPermissions.globalConfigs ? await this._loadAllGlobalConfigs(!writePermissions.globalConfigs) : undefined
  }

  private async getScopedConfigs(permissions: FilePermissions): Promise<EditableFile[] | undefined> {
    const { readPermissions, writePermissions } = permissions
    return readPermissions.botConfigs
      ? await this._loadBotConfigs(!writePermissions.botConfigs, this._botId)
      : undefined
  }

  private _filterBuiltin(files: EditableFile[]) {
    return this._config.includeBuiltin ? files : files.filter(x => !x.content.includes('//CHECKSUM:'))
  }

  async _validateMetadata({ name, botId, type, hookType, content, location }: Partial<EditableFile>) {
    if (botId && botId.length && botId !== this._botId) {
      throw new Error(
        `Can't perform modification on bot ${botId}. Please switch to the correct bot to change its actions.`
      )
    }

    if (!ALLOWED_TYPES.includes(type)) {
      throw new Error(`Invalid file type, only ${ALLOWED_TYPES} are allowed at the moment`)
    }

    if (type === 'hook') {
      this._validateHook(hookType, botId)
    }

    if (type === 'bot_config') {
      this._validateBotConfig(content, location, botId)
    }

    if (type === 'global_config') {
      this._validateGlobalConfig(content, location, botId)
    }

    if (type === 'module_config') {
      await this._validateModulesConfig(content, location, botId)
    }

    this._validateFilename(name)
  }

  private _validateHook(hookType: string, botId: string) {
    if (!HOOK_SIGNATURES[hookType]) {
      throw new Error('Invalid hook type.')
    }

    if (botId) {
      throw new EditorError(`Can't save a hook with a bot id`, EditorErrorStatus.INVALID_CONTENT)
    }
  }

  private _validateBotConfig(config: string, location: string, botId: string | undefined) {
    if (location !== 'bot.config.json') {
      throw new EditorError(`Invalid location for a bot config file: ${location}`, EditorErrorStatus.INVALID_NAME)
    }
    if (!botId) {
      throw new EditorError(`Can't save a bot config file without a bot id`, EditorErrorStatus.INVALID_CONTENT)
    }

    return this._assertIsValidJson(config)
  }

  private _validateGlobalConfig(config: string, location: string, botId: string | undefined) {
    if (!MAIN_GLOBAL_CONFIG_FILES.includes(location)) {
      throw new EditorError(`Invalid location for a global config file: ${location}`, EditorErrorStatus.INVALID_NAME)
    }
    if (botId) {
      throw new EditorError(`Can't save a global config file with a bot id`, EditorErrorStatus.INVALID_CONTENT)
    }

    return this._assertIsValidJson(config)
  }

  private async _validateModulesConfig(config: string, location: string, botId: string | undefined) {
    const deconstructedPath = location.split('/').filter(x => !!x)
    const [dirName, fileName] = deconstructedPath

    const ghost = this.bp.ghost.forGlobal()
    const moduleConfigFiles = await ghost.directoryListing(dirName, '*.json')

    const fileIsInConfig = dirName === 'config'
    const fileIsOfDepthOne = deconstructedPath.length === 2
    const fileExists = moduleConfigFiles.includes(fileName)

    if (!fileIsInConfig || !fileIsOfDepthOne || !fileExists) {
      throw new EditorError(`Invalid location for a module config file: ${location}`, EditorErrorStatus.INVALID_NAME)
    }
    if (botId) {
      throw new EditorError(`Can't save a global config file with a bot id`, EditorErrorStatus.INVALID_CONTENT)
    }

    return this._assertIsValidJson(config)
  }

  private _assertIsValidJson(content: string): boolean {
    try {
      JSON.parse(content)
      return true
    } catch (err) {
      throw new EditorError(`Invalid JSON file. ${err}`, EditorErrorStatus.INVALID_CONTENT)
    }
  }

  private _validateFilename(filename: string) {
    if (!FILENAME_REGEX.test(filename)) {
      throw new EditorError('Filename has invalid characters', EditorErrorStatus.INVALID_NAME)
    }
  }

  private _getGhost(file: EditableFile): sdk.ScopedGhostService {
    return file.botId ? this.bp.ghost.forBot(this._botId) : this.bp.ghost.forGlobal()
  }

  private _assertWritePermissions(file: EditableFile, permissions: FilePermissions) {
    const { type, botId, name } = file

    const { writePermissions } = permissions

    let isAllowed = false
    if (type === 'action') {
      isAllowed = botId ? writePermissions.botActions : writePermissions.globalActions
    } else if (type === 'bot_config') {
      isAllowed = writePermissions.botConfigs
    } else if (type === 'global_config' || type === 'module_config') {
      isAllowed = writePermissions.globalConfigs
    } else if (type === 'hook') {
      isAllowed = writePermissions.hooks
    }

    if (!isAllowed) {
      throw new WritePermissionError(`Insufficient permissions to apply modifications on file ${name}`)
    }
  }

  async saveFile(file: EditableFile, permissions: FilePermissions): Promise<void> {
    await this._validateMetadata(file)
    this._assertWritePermissions(file, permissions)

    const { location, content, hookType, type } = file

    const ghost = this._getGhost(file)
    if (type === 'action') {
      return ghost.upsertFile('/actions', location, content, { syncDbToDisk: true })
    }

    if (type === 'hook') {
      return ghost.upsertFile(`/hooks/${hookType}`, location.replace(hookType, ''), content, { syncDbToDisk: true })
    }

    if (type === 'bot_config' || type === 'global_config' || type === 'module_config') {
      return ghost.upsertFile('/', location, content)
    }
  }

  async deleteFile(file: EditableFile, permissions: FilePermissions): Promise<void> {
    await this._validateMetadata(file)
    this._assertWritePermissions(file, permissions)

    const { location, hookType, type } = file
    const ghost = this._getGhost(file)

    if (type === 'action') {
      return ghost.deleteFile('/actions', location)
    }
    if (type === 'hook') {
      return ghost.deleteFile(`/hooks/${hookType}`, location.replace(hookType, ''))
    }
  }

  async renameFile(file: EditableFile, newName: string, permissions: FilePermissions): Promise<void> {
    await this._validateMetadata(file)
    this._validateFilename(newName)
    this._assertWritePermissions(file, permissions)

    const { location, hookType, type, name } = file
    const ghost = this._getGhost(file)

    const newLocation = location.replace(name, newName)
    if (type === 'action' && !(await ghost.fileExists('/actions', newLocation))) {
      await ghost.renameFile('/actions', location, newLocation)
      return
    }

    const hookLocation = location.replace(hookType, '')
    const newHookLocation = hookLocation.replace(name, newName)
    if (type === 'hook' && !(await ghost.fileExists(`/hooks/${hookType}`, newHookLocation))) {
      await ghost.renameFile(`/hooks/${hookType}`, hookLocation, newHookLocation)
      return
    }

    throw new EditorError('File already exists', EditorErrorStatus.FILE_ALREADY_EXIST)
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
      'process.d.ts': this._buildRestrictedProcessVars(),
      'node.d.ts': nodeTyping.toString(),
      'botpress.d.ts': sdkTyping.toString().replace(`'botpress/sdk'`, `sdk`),
      'bot.config.schema.json': botSchema.toString(),
      'botpress.config.schema.json': botpressConfigSchema.toString()
    }

    return this._typings
  }

  private async _loadActions(readOnly: boolean, botId?: string): Promise<EditableFile[]> {
    const ghost = botId ? this.bp.ghost.forBot(botId) : this.bp.ghost.forGlobal()

    return Promise.map(ghost.directoryListing('/actions', '*.js', undefined, true), async (filepath: string) => {
      return {
        name: path.basename(filepath),
        type: 'action' as FileType,
        location: filepath,
        content: await ghost.readFileAsString('/actions', filepath),
        botId,
        readOnly
      }
    })
  }

  private async _loadHooks(readOnly: boolean): Promise<EditableFile[]> {
    const ghost = this.bp.ghost.forGlobal()

    return Promise.map(ghost.directoryListing('/hooks', '*.js', undefined, true), async (filepath: string) => {
      return {
        name: path.basename(filepath),
        type: 'hook' as FileType,
        location: filepath,
        hookType: filepath.substr(0, filepath.indexOf('/')),
        content: await ghost.readFileAsString('/hooks', filepath),
        readOnly
      }
    })
  }

  private async _loadBotConfigs(readOnly: boolean, botId: string): Promise<EditableFile[]> {
    const ghost = this.bp.ghost.forBot(botId)
    const fileNames = await ghost.directoryListing('/', 'bot.config.json', undefined, true)

    return Promise.map(fileNames, async (filepath: string) => ({
      name: path.basename(filepath),
      type: 'bot_config' as FileType,
      botId,
      location: filepath,
      content: await ghost.readFileAsString('/', filepath),
      readOnly
    }))
  }

  private async _loadAllGlobalConfigs(readOnly: boolean): Promise<EditableFile[]> {
    const globalConfigFiles = await this._loadMainGlobalConfig(readOnly)
    const modulesConfigsFiles = await this._loadModulesGlobalConfig(readOnly)
    return [...globalConfigFiles, ...modulesConfigsFiles]
  }

  private async _loadModulesGlobalConfig(readOnly: boolean): Promise<EditableFile[]> {
    const ghost = this.bp.ghost.forGlobal()

    let modulesConfigsFiles = await ghost.directoryListing('/config', '*.json', undefined, true)
    modulesConfigsFiles = modulesConfigsFiles.map((name: string) => 'config/' + name)

    return Promise.map(modulesConfigsFiles, async (filepath: string) => ({
      name: path.basename(filepath),
      type: 'module_config' as FileType,
      location: filepath,
      content: await ghost.readFileAsString('/', filepath),
      readOnly
    }))
  }

  private async _loadMainGlobalConfig(readOnly: boolean): Promise<EditableFile[]> {
    const ghost = this.bp.ghost.forGlobal()
    const fileNames = MAIN_GLOBAL_CONFIG_FILES
    return Promise.map(fileNames, async (filepath: string) => ({
      name: path.basename(filepath),
      type: 'global_config' as FileType,
      location: filepath,
      content: await ghost.readFileAsString('/', filepath),
      readOnly
    }))
  }

  private _buildRestrictedProcessVars() {
    const exposedEnv = {
      ..._.pickBy(process.env, (_value, name) => name.startsWith('EXPOSED_')),
      ..._.pick(process.env, 'TZ', 'LANG', 'LC_ALL', 'LC_CTYPE')
    }
    const root = this._extractInfo(_.pick(process, 'HOST', 'PORT', 'EXTERNAL_URL', 'PROXY', 'ROOT_PATH'))
    const exposed = this._extractInfo(exposedEnv)

    return `
    declare var process: RestrictedProcess;
    interface RestrictedProcess {
      ${root.map(x => {
        return `/** Current value: ${x.value} */
${x.name}: ${x.type}
`
      })}

      env: {
        ${exposed.map(x => {
          return `/** Current value: ${x.value} */
  ${x.name}: ${x.type}
  `
        })}
      }
    }`
  }

  private _extractInfo(keys) {
    return Object.keys(keys).map(name => {
      return { name, value: keys[name], type: typeof keys[name] }
    })
  }
}
