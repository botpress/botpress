import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import { Config } from '../config'
import { HOOK_SIGNATURES } from '../typings/hooks'

import { EditorError, EditorErrorStatus } from './editorError'
import { EditableFile, FileType, TypingDefinitions } from './typings'

const FILENAME_REGEX = /^[0-9a-zA-Z_\-.]+$/
const ALLOWED_TYPES = ['hook', 'action', 'bot_config']

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

  isGlobalAllowed() {
    return this._config.allowGlobal
  }

  getConfig(): Config {
    return this._config
  }

  async fetchFiles() {
    return {
      actionsGlobal: this._config.allowGlobal && this._filterBuiltin(await this._loadActions()),
      hooksGlobal: this._config.allowGlobal && this._filterBuiltin(await this._loadHooks()),
      actionsBot: this._filterBuiltin(await this._loadActions(this._botId)),
      botConfigs: this._config.includeBotConfig && (await this._loadBotConfigs(this._config.allowGlobal))
    }
  }

  private _filterBuiltin(files: EditableFile[]) {
    return this._config.includeBuiltin ? files : files.filter(x => !x.content.includes('//CHECKSUM:'))
  }

  _validateMetadata({ name, botId, type, hookType, content }: Partial<EditableFile>) {
    if (!botId || !botId.length) {
      if (!this._config.allowGlobal) {
        throw new Error(`Global files are restricted, please check your configuration`)
      }
    } else {
      if (botId !== this._botId) {
        throw new Error(`Please switch to the correct bot to change its actions.`)
      }
    }

    if (!ALLOWED_TYPES.includes(type)) {
      throw new Error(`Invalid file type, only ${ALLOWED_TYPES} are allowed at the moment`)
    }

    if (type === 'hook' && !HOOK_SIGNATURES[hookType]) {
      throw new Error('Invalid hook type.')
    }

    if (type === 'bot_config') {
      if (!this._config.includeBotConfig) {
        throw new Error(`Enable "includeBotConfig" in the Code Editor configuration to save those files.`)
      }

      this._validateBotConfig(content)
    }

    this._validateFilename(name)
  }

  private _validateBotConfig(config: string) {
    try {
      JSON.parse(config)
      return true
    } catch (err) {
      throw new EditorError(`Invalid JSON file. ${err}`, EditorErrorStatus.INVALID_NAME)
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

  async saveFile(file: EditableFile): Promise<void> {
    this._validateMetadata(file)
    const { location, content, hookType, type } = file
    const ghost = this._getGhost(file)

    if (type === 'action') {
      return ghost.upsertFile('/actions', location, content)
    } else if (type === 'hook') {
      return ghost.upsertFile(`/hooks/${hookType}`, location.replace(hookType, ''), content)
    } else if (type === 'bot_config') {
      return ghost.upsertFile('/', 'bot.config.json', content)
    }
  }

  async deleteFile(file: EditableFile): Promise<void> {
    this._validateMetadata(file)
    const { location, hookType, type } = file
    const ghost = this._getGhost(file)

    if (type === 'action') {
      return ghost.deleteFile('/actions', location)
    }
    if (type === 'hook') {
      return ghost.deleteFile(`/hooks/${hookType}`, location.replace(hookType, ''))
    }
  }

  async renameFile(file: EditableFile, newName: string): Promise<void> {
    this._validateMetadata(file)
    this._validateFilename(newName)

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

    this._typings = {
      'process.d.ts': this._buildRestrictedProcessVars(),
      'node.d.ts': nodeTyping.toString(),
      'botpress.d.ts': sdkTyping.toString().replace(`'botpress/sdk'`, `sdk`),
      'bot.config.schema.json': botSchema.toString()
    }

    return this._typings
  }

  private async _loadActions(botId?: string): Promise<EditableFile[]> {
    const ghost = botId ? this.bp.ghost.forBot(botId) : this.bp.ghost.forGlobal()

    return Promise.map(ghost.directoryListing('/actions', '*.js', undefined, true), async (filepath: string) => {
      return {
        name: path.basename(filepath),
        type: 'action' as FileType,
        location: filepath,
        content: await ghost.readFileAsString('/actions', filepath),
        botId
      }
    })
  }

  private async _loadHooks(): Promise<EditableFile[]> {
    const ghost = this.bp.ghost.forGlobal()

    return Promise.map(ghost.directoryListing('/hooks', '*.js', undefined, true), async (filepath: string) => {
      return {
        name: path.basename(filepath),
        type: 'hook' as FileType,
        location: filepath,
        hookType: filepath.substr(0, filepath.indexOf('/')),
        content: await ghost.readFileAsString('/hooks', filepath)
      }
    })
  }

  private async _loadBotConfigs(includeAllBots: boolean): Promise<EditableFile[]> {
    const ghost = includeAllBots ? this.bp.ghost.forBots() : this.bp.ghost.forBot(this._botId)

    return Promise.map(ghost.directoryListing('/', 'bot.config.json', undefined, true), async (filepath: string) => {
      return {
        name: path.basename(filepath),
        type: 'bot_config' as FileType,
        botId: filepath.substr(0, filepath.indexOf('/')),
        location: filepath,
        content: await ghost.readFileAsString('/', filepath)
      }
    })
  }

  private _buildRestrictedProcessVars() {
    const exposedEnv = {
      ..._.pickBy(process.env, (_value, name) => name.startsWith('EXPOSED_')),
      ..._.pick(process.env, 'TZ', 'LANG', 'LC_ALL', 'LC_CTYPE')
    }
    const root = this._extractInfo(_.pick(process, 'HOST', 'PORT', 'EXTERNAL_URL', 'PROXY'))
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
