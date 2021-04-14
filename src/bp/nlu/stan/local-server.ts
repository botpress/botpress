import { Logger } from 'botpress/sdk'
const ID = 'LocalSTANServer'
import bytes from 'bytes'
import chalk from 'chalk'
import { LogLevel } from 'core/logger/enums'
import { centerText } from 'core/logger/utils'
import { copyDir } from 'core/misc/pkg-fs'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import * as NLUEngine from 'nlu/engine'
import { ArgV as STANOptions } from 'nlu/stan'
import API from 'nlu/stan/api'
import path from 'path'

@injectable()
export class LocalSTANServer {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', ID)
    private logger: Logger
  ) {}

  public async listen() {
    const options: STANOptions = {
      ducklingURL: 'http://localhost:8000/',
      ducklingEnabled: false,
      languageURL: 'https://lang-01.botpress.io/',
      host: '0.0.0.0',
      port: 3200,
      limitWindow: '1s',
      limit: 10000,
      bodySize: '50mb',
      batchSize: 2,
      silent: false,
      modelCacheSize: '900mb'
    }
    const config: NLUEngine.Config = {
      languageSources: [
        {
          endpoint: options.languageURL,
          authToken: options.languageAuthToken
        }
      ],
      ducklingEnabled: options.ducklingEnabled,
      ducklingURL: options.ducklingURL,
      modelCacheSize: options.modelCacheSize,
      legacyElection: false
    }
    for (const dir of ['./pre-trained', './stop-words']) {
      await copyDir(path.resolve(__dirname, '../engine/assets', dir), path.resolve(process.APP_DATA_PATH, dir))
    }

    if (!bytes(options.bodySize)) {
      throw new Error(`Specified body-size "${options.bodySize}" has an invalid format.`)
    }

    const modelDir = path.join(process.APP_DATA_PATH, 'models')

    global.printLog = args => {
      const message = args[0]
      const rest = args.slice(1)

      this.logger.level(LogLevel.DEV).debug(message.trim(), rest)
    }
    const loggerWrapper: NLUEngine.Logger = {
      debug: (msg: string) => this.logger.debug(msg),
      info: (msg: string) => this.logger.info(msg),
      warning: (msg: string, err?: Error) => (err ? this.logger.attachError(err).warn(msg) : this.logger.warn(msg)),
      error: (msg: string, err?: Error) => (err ? this.logger.attachError(err).error(msg) : this.logger.error(msg))
    }

    const engine = await NLUEngine.makeEngine(config, loggerWrapper)
    const { nluVersion } = engine.getSpecifications()

    this.logger.info(chalk`========================================
  {bold ${centerText('Botpress Standalone NLU', 40, 9)}}
  {dim ${centerText(`Version ${nluVersion}`, 40, 9)}}
  {dim ${centerText(`OS ${process.distro}`, 40, 9)}}
  ${_.repeat(' ', 9)}========================================`)

    if (options.authToken?.length) {
      this.logger.info(`authToken: ${chalk.greenBright('enabled')} (only users with this token can query your server)`)
    } else {
      this.logger.info(`authToken: ${chalk.redBright('disabled')} (anyone can query your nlu server)`)
    }

    if (options.limit) {
      this.logger.info(
        `limit: ${chalk.greenBright('enabled')} allowing ${options.limit} requests/IP address in a ${
          options.limitWindow
        } timeframe `
      )
    } else {
      this.logger.info(`limit: ${chalk.redBright('disabled')} (no protection - anyone can query without limitation)`)
    }

    if (options.ducklingEnabled) {
      this.logger.info(`duckling: ${chalk.greenBright('enabled')} url=${options.ducklingURL}`)
    } else {
      this.logger.info(`duckling: ${chalk.redBright('disabled')}`)
    }
    this.logger.info(`lang server: url=${options.languageURL}`)

    this.logger.info(`body size: allowing HTTP resquests body of size ${options.bodySize}`)
    this.logger.info(`models stored at "${modelDir}"`)

    if (options.batchSize > 0) {
      this.logger.info(`batch size: allowing up to ${options.batchSize} predictions in one call to POST /predict`)
    }

    await API(options, engine)
  }
}
