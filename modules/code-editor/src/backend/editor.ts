import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import { Config } from '../config'

import { EditableFile, FileType, TypingDefinitions } from './typings'

const FILENAME_REGEX = /^[0-9a-zA-Z_\-.]+$/

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

  async fetchFiles() {
    return {
      actionsGlobal: this._config.allowGlobal && (await this._loadFiles('/actions', 'action')),
      actionsBot: await this._loadFiles('/actions', 'action', this._botId)
    }
  }

  async _validateMetadata({ name, botId, type }: Partial<EditableFile>) {
    if (!botId || !botId.length) {
      if (!this._config.allowGlobal) {
        throw new Error(`Global files are restricted, please check your configuration`)
      }
    } else {
      if (botId !== this._botId) {
        throw new Error(`Please switch to the correct bot to change its actions.`)
      }
    }

    if (type !== 'action') {
      throw new Error('Invalid file type Only actions are allowed at the moment')
    }

    if (!FILENAME_REGEX.test(name)) {
      throw new Error('Filename has invalid characters')
    }
  }

  async saveFile(file: EditableFile): Promise<void> {
    this._validateMetadata(file)
    const { location, botId, content } = file
    const ghost = botId ? this.bp.ghost.forBot(this._botId) : this.bp.ghost.forGlobal()

    return ghost.upsertFile('/actions', location, content)
  }

  async loadTypings() {
    if (this._typings) {
      return this._typings
    }

    const sdkTyping = fs.readFileSync(path.join(__dirname, '/../botpress.d.js'), 'utf-8')

    this._typings = {
      'process.d.ts': this._buildRestrictedProcessVars(),
      'node.d.ts': this._getNodeTypings().toString(),
      'botpress.d.ts': sdkTyping.toString().replace(`'botpress/sdk'`, `sdk`)
    }

    return this._typings
  }

  private _getNodeTypings() {
    const getTypingPath = folder => path.join(__dirname, `/../../${folder}/@types/node/index.d.ts`)

    if (fs.existsSync(getTypingPath('node_modules'))) {
      return fs.readFileSync(getTypingPath('node_modules'), 'utf-8')
    }
    return fs.readFileSync(getTypingPath('node_production_modules'), 'utf-8')
  }

  private async _loadFiles(rootFolder: string, type: FileType, botId?: string): Promise<EditableFile[]> {
    const ghost = botId ? this.bp.ghost.forBot(botId) : this.bp.ghost.forGlobal()

    return Promise.map(await ghost.directoryListing(rootFolder, '*.js'), async (filepath: string) => {
      return {
        name: path.basename(filepath),
        location: filepath,
        content: await ghost.readFileAsString(rootFolder, filepath),
        type,
        botId
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
