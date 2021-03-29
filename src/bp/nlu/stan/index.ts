// eslint-disable-next-line import/order
import rewire from '../../sdk/rewire'
// eslint-disable-next-line import/order

import bytes from 'bytes'
import chalk from 'chalk'
import cluster from 'cluster'
import { LogLevel } from 'core/logger/enums'
import { centerText } from 'core/logger/utils'
import { copyDir } from 'core/misc/pkg-fs'
import _ from 'lodash'
import * as NLUEngine from 'nlu/engine'
import path from 'path'
import { setupMasterNode, WORKER_TYPES } from '../../cluster'

import Logger from '../../simple-logger'
import API, { APIOptions } from './api'

global.rewire = rewire as any
const debug = DEBUG('api')

const GH_TYPINGS_FILE = 'https://github.com/botpress/botpress/blob/master/src/bp/nlu-server/typings_v1.d.ts'
const GH_TRAIN_INPUT_EXAMPLE = 'https://github.com/botpress/botpress/blob/master/src/bp/nlu-server/train-example.json'

type ArgV = APIOptions & {
  languageURL: string
  languageAuthToken?: string
  ducklingURL: string
  ducklingEnabled: boolean
}

const makeEngine = async (options: ArgV, logger: Logger) => {
  const loggerWrapper: NLUEngine.Logger = {
    debug: (msg: string) => logger.debug(msg),
    info: (msg: string) => logger.info(msg),
    warning: (msg: string, err?: Error) => (err ? logger.attachError(err).warn(msg) : logger.warn(msg)),
    error: (msg: string, err?: Error) => (err ? logger.attachError(err).error(msg) : logger.error(msg))
  }

  try {
    const { ducklingEnabled, ducklingURL, modelCacheSize, languageURL, languageAuthToken } = options
    const config: NLUEngine.Config = {
      languageSources: [
        {
          endpoint: languageURL,
          authToken: languageAuthToken
        }
      ],
      ducklingEnabled,
      ducklingURL,
      modelCacheSize
    }

    const engine = await NLUEngine.makeEngine(config, loggerWrapper)
    return engine
  } catch (err) {
    // TODO: Make lang provider throw if it can't connect.
    logger
      .attachError(err)
      .error(
        'There was an error while initializing Engine tools. Check out the connection to your language and Duckling server.'
      )
    process.exit(1)
  }
}

export default async function(options: ArgV) {
  const logger = new Logger('Launcher')
  if (cluster.isMaster) {
    setupMasterNode(logger)
    return
  } else if (cluster.isWorker && process.env.WORKER_TYPE !== WORKER_TYPES.WEB) {
    return
  }

  for (const dir of ['./pre-trained', './stop-words']) {
    await copyDir(path.resolve(__dirname, '../nlu/engine/assets', dir), path.resolve(process.APP_DATA_PATH, dir))
  }

  if (!bytes(options.bodySize)) {
    throw new Error(`Specified body-size "${options.bodySize}" has an invalid format.`)
  }

  options.modelDir = options.modelDir || path.join(process.APP_DATA_PATH, 'models')

  global.printLog = args => {
    const message = args[0]
    const rest = args.slice(1)

    logger.level(LogLevel.DEV).debug(message.trim(), rest)
  }

  debug('NLU Server Options %o', options)

  const engine = await makeEngine(options, logger)
  const { nluVersion } = engine.getSpecifications()

  logger.info(chalk`========================================
{bold ${centerText('Botpress Standalone NLU', 40, 9)}}
{dim ${centerText(`Version ${nluVersion}`, 40, 9)}}
{dim ${centerText(`OS ${process.distro}`, 40, 9)}}
${_.repeat(' ', 9)}========================================`)

  if (options.authToken?.length) {
    logger.info(`authToken: ${chalk.greenBright('enabled')} (only users with this token can query your server)`)
  } else {
    logger.info(`authToken: ${chalk.redBright('disabled')} (anyone can query your nlu server)`)
  }

  if (options.limit) {
    logger.info(
      `limit: ${chalk.greenBright('enabled')} allowing ${options.limit} requests/IP address in a ${
        options.limitWindow
      } timeframe `
    )
  } else {
    logger.info(`limit: ${chalk.redBright('disabled')} (no protection - anyone can query without limitation)`)
  }

  if (options.ducklingEnabled) {
    logger.info(`duckling: ${chalk.greenBright('enabled')} url=${options.ducklingURL}`)
  } else {
    logger.info(`duckling: ${chalk.redBright('disabled')}`)
  }
  logger.info(`lang server: url=${options.languageURL}`)

  logger.info(`body size: allowing HTTP resquests body of size ${options.bodySize}`)
  logger.info(`models stored at "${options.modelDir}"`)

  if (options.batchSize > 0) {
    logger.info(`batch size: allowing up to ${options.batchSize} predictions in one call to POST /predict`)
  }

  if (!options.silent) {
    const { host, port } = options

    const baseUrl = `http://${host}:${port}/v1`

    logger.info(chalk`

{bold {underline Available Routes}}

{green /**
 * Gets the current version of botpress core NLU. Usefull to test if your installation is working.
 * @returns {bold version}: botpress core NLU version number.
*/}
{bold GET ${baseUrl}/info}

{green /**
  * Starts a training.
  * @body_parameter {bold language} Language to use for training.
  * @body_parameter {bold intents} Intents definitions.
  * @body_parameter {bold contexts} All available contexts.
  * @body_parameter {bold entities} Entities definitions.
  * @body_parameter {bold password} Password to protect your model. {yellow ** Optionnal **}
  * @body_parameter {bold seed} Number to seed random number generators used during training (beta feature). {yellow ** Optionnal **}
  * @returns {bold modelId} A model id for futur API calls
 */}
{bold POST ${baseUrl}/train}

{green /**
  * Gets a training progress status.
  * @path_parameter {bold modelId} The model id for which you seek the training progress.
  * @query_parameter {bold password} The password protecting your model.
  * @returns {bold session} A training session data structure with information on desired model.
 */}
{bold GET ${baseUrl}/train/:modelId?password=XXXXXX}

{green /**
  * Cancels a training.
  * @path_parameter {bold modelId} The model id for which you want to cancel the training.
  * @body_parameter {bold password} The password protecting your model.
 */}
{bold POST ${baseUrl}/train/:modelId/cancel}

{green /**
  * Perform prediction for a text input.
  * @path_parameter {bold modelId} The model id you want to use for prediction.
  * @body_parameter {bold password} The password protecting your model.
  * @body_parameter {bold utterances} Array of text for which you want a prediction.
  * @returns {bold predictions} Array of predictions; Each prediction is a data structure reprensenting our understanding of the text.
 */}
{bold POST ${baseUrl}/predict/:modelId}

{bold For more detailed information on typings, see
${GH_TYPINGS_FILE}}.

{bold For a complete example on training input, see
${GH_TRAIN_INPUT_EXAMPLE}}.

    `)
  }

  await API(options, engine)
}
