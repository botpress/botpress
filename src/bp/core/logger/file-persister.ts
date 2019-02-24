import { Logger, LoggerEntry } from 'botpress/sdk'
import fs from 'fs'
import { injectable } from 'inversify'

import { BotpressConfig } from 'core/config/botpress.config'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import path from 'path'

@injectable()
export class LoggerFilePersister {
  private readonly INTERVAL = ms('2s')

  private batch: string[] = []
  private intervalRef
  private currentPromise
  private maxFileSize!: number
  private outputFolder!: string
  private logger!: Logger

  constructor() {}

  async initialize(botpressConfig: BotpressConfig, logger: Logger) {
    const logsConfig = _.get(botpressConfig, 'logs.fileOutput', {})
    if (!logsConfig.enabled) {
      return
    }

    this.logger = logger
    this.outputFolder = logsConfig.folder
    this.maxFileSize = 1024 * logsConfig.maxFileSize

    if (process.env.DEBUG_LOGGER) {
      this.logger.debug(`Saving logs to ${this.outputFolder}, keeping file size under ${logsConfig.maxFileSize} kb`)
    }

    if (await this._isOutputWritable()) {
      this.start()
    }
  }

  appendLog(entry: LoggerEntry) {
    const bot = entry.botId ? `(bot: ${entry.botId})` : ''
    this.batch.push(`${entry.timestamp} ${entry.scope} (${entry.level}) ${bot} ${entry.message}${entry.metadata}\n`)
  }

  start() {
    if (this.intervalRef) {
      return
    }
    this.intervalRef = setInterval(this._runTask, this.INTERVAL)
  }

  stop() {
    clearInterval(this.intervalRef)
    this.intervalRef = undefined
  }

  private async _isOutputWritable() {
    const fullPath = path.resolve(this.outputFolder)

    try {
      await fs.existsSync(fullPath)
      await fs.accessSync(fullPath, fs.constants.W_OK)
      return true
    } catch (err) {
      throw new Error(
        `Unable to write in the specified folder ("${fullPath}"). Please check configuration or disable log file output`
      )
    }
  }

  private _getLogFileName(includeTimestamp = false) {
    const format = includeTimestamp ? 'YYYYMMDD_HHmmss' : 'YYYYMMDD'
    return `logs_${moment().format(format)}.log`
  }

  private async _rotateFile() {
    const original = path.resolve(this.outputFolder, this._getLogFileName())
    const newName = path.resolve(this.outputFolder, this._getLogFileName(true))

    if (await fs.existsSync(original)) {
      await fs.renameSync(original, newName)
      if (process.env.DEBUG_LOGGER) {
        this.logger.debug(`Log file rotated: ${original} -> ${newName}`)
      }
    }
  }

  private async _fileNeedsRotation(textLength) {
    try {
      const { size } = await fs.statSync(this._getLogFileName())
      return size + textLength > this.maxFileSize
    } catch (error) {
      return false
    }
  }

  private _runTask = async () => {
    if (this.currentPromise || this.batch.length === 0) {
      return
    }

    if (process.env.DEBUG_LOGGER) {
      this.logger.debug(`Saving ${this.batch.length} logs`)
    }

    const content = this.batch.join('')
    this.batch = []

    if (await this._fileNeedsRotation(content.length)) {
      await this._rotateFile()
    }

    const logStream = await fs.createWriteStream(this._getLogFileName(), { flags: 'a' })
    this.currentPromise = Promise.fromCallback(cb =>
      logStream.write(content, err => {
        logStream.end(cb)
      })
    ).finally(() => {
      this.currentPromise = undefined
    })
  }
}
