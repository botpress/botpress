import { Logger, LoggerEntry } from 'botpress/sdk'
import { BotpressConfig } from 'core/config/botpress.config'
import fs from 'fs'
import { injectable } from 'inversify'
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
  private enabled = false

  constructor() {}

  async initialize(botpressConfig: BotpressConfig, logger: Logger) {
    const logsConfig = _.get(botpressConfig, 'logs.fileOutput', {})
    if (!logsConfig.enabled) {
      return
    }

    this.logger = logger
    this.outputFolder = logsConfig.folder
    this.maxFileSize = 1024 * logsConfig.maxFileSize
    this.enabled = true

    if (process.env.DEBUG_LOGGER) {
      this.logger.debug(`Saving logs to ${this.outputFolder}, keeping file size under ${logsConfig.maxFileSize} kb`)
    }

    if (this._isOutputWritable()) {
      this.start()
    }
  }

  appendLog(entry: LoggerEntry) {
    if (!this.enabled) {
      return
    }

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

  private _isOutputWritable() {
    const fullPath = path.resolve(this.outputFolder)

    try {
      if (fs.existsSync(fullPath)) {
        fs.accessSync(fullPath, fs.constants.W_OK)
        return true
      }
      throw new Error(`Specified folder doesn't exist ("${fullPath}").`)
    } catch (err) {
      throw new Error(
        `Unable to write in the specified folder ("${fullPath}"). Please check configuration or disable log file output`
      )
    }
  }

  private _getLogFilePath(includeTimestamp = false) {
    const format = includeTimestamp ? 'YYYYMMDD_HHmmss' : 'YYYYMMDD'
    return path.resolve(this.outputFolder, `logs_${moment().format(format)}.log`)
  }

  private _rotateFile() {
    const original = this._getLogFilePath()
    const newName = this._getLogFilePath(true)

    if (fs.existsSync(original)) {
      fs.renameSync(original, newName)
      if (process.env.DEBUG_LOGGER) {
        this.logger.debug(`Log file rotated: ${original} -> ${newName}`)
      }
    }
  }

  private _fileNeedsRotation(textLength) {
    try {
      const { size } = fs.statSync(this._getLogFilePath())
      return size + textLength > this.maxFileSize
    } catch (error) {
      return false
    }
  }

  private _runTask = () => {
    if (this.currentPromise || this.batch.length === 0) {
      return
    }

    if (process.env.DEBUG_LOGGER) {
      this.logger.debug(`Saving ${this.batch.length} log${this.batch.length === 1 ? '' : 's'}`)
    }

    const content = this.batch.join('')
    this.batch = []

    if (this._fileNeedsRotation(content.length)) {
      this._rotateFile()
    }

    const logStream = fs.createWriteStream(this._getLogFilePath(), { flags: 'a' })
    this.currentPromise = Promise.fromCallback(cb =>
      logStream.write(content, err => {
        logStream.end(cb)
      })
    ).finally(() => {
      this.currentPromise = undefined
    })
  }
}
