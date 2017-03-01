import 'source-map-support/register'

import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import cluster from 'cluster'

import EventBus from './bus'

import createMiddlewares from './middlewares'
import createLogger from './logger'
import createSecurity from './security'
import createNotifications from './notifications'
import createHearMiddleware from './hear'
import createDatabase from './database'
import createLicensing from './licensing'
import createAbout from './about'
import createModules from './modules'
import stats from './stats'
import packageJson from '../package.json'

import WebServer from './server'

import { getBotpressVersion } from './util'

import {
  isDeveloping,
  print
} from './util'

const RESTART_EXIT_CODE = 107

const getDataLocation = (dataDir, projectLocation) => (
  dataDir && path.isAbsolute(dataDir)
    ? path.resolve(dataDir)
    : path.resolve(projectLocation, dataDir || 'data')
)

const mkdirIfNeeded = (path, logger) => {
  if (!fs.existsSync(path)) {
    logger.info('creating data directory: ' + path)

    try {
      fs.mkdirSync(path)
    } catch (err) {
      logger.error('(fatal) error creating directory: ', err.message)
      process.exit(1)
    }
  }
}

/**
 * Global context botpress
 *
 * @property {string} projectLocation
 * @property {Object} botfile
 * @property {Logger} logger
 *
 * @property {Function} login - check security.js
 * @property {Function} authenticate - check security.js
 * @property {Function} getSecret - check security.js
 *
 * @example
 *
 * const botfile = fs.readFileSync(path)
 * const bot = new botpress({ botfile })
 * bot.start()
 */
class botpress {
  /**
   * Create botpress
   *
   * @param {string} obj.botfile - the config path
   */
  constructor({ botfile }) {
    this.version = getBotpressVersion()
    /**
     * The project location, which is the folder where botfile.js located
     */
    this.projectLocation = path.dirname(botfile)

    /**
     * The botfile config object
     */
    this.botfile = require(botfile)

    this.stats = stats(this.botfile)

    this.interval = null
  }

  /**
   * Start the bot instance
   *
   * It will do the following initiation steps:
   *
   * 1. setup logger
   * 2. resolve paths (dataLocation)
   * 3. inject security functions
   * 4. load modules
   */
  _start() {

    this.stats.track('bot', 'started')

    if (!this.interval) {
      this.inverval = setInterval(() => {
        this.stats.track('bot', 'running')
      }, 30 * 1000)
    }

    // change the current working directory to botpress's installation path
    // the bot's location is kept in this.projectLocation
    process.chdir(path.join(__dirname, '../'))

    const {projectLocation, botfile} = this

    const isFirstRun = fs.existsSync(path.join(projectLocation, '.welcome'))
    const dataLocation = getDataLocation(botfile.dataDir, projectLocation)
    const modulesConfigDir = getDataLocation(botfile.modulesConfigDir, projectLocation)
    const dbLocation = path.join(dataLocation, 'db.sqlite')
    const version = packageJson.version

    const logger = createLogger(dataLocation, botfile.log)
    mkdirIfNeeded(dataLocation, logger)
    mkdirIfNeeded(modulesConfigDir, logger)

    logger.info(`Starting botpress version ${version}`)

    const security = createSecurity(dataLocation, botfile.login)

    const db = createDatabase({
      sqlite: { location: dbLocation },
      postgres: botfile.postgres
    })

    const modules = createModules(logger, projectLocation, dataLocation, db.kvs)

    const moduleDefinitions = modules._scan()

    const events = new EventBus()
    const notifications = createNotifications(dataLocation, botfile.notification, moduleDefinitions, events, logger)
    const about = createAbout(projectLocation)
    const licensing = createLicensing(projectLocation)
    const middlewares = createMiddlewares(this, dataLocation, projectLocation, logger)
    const {hear, middleware: hearMiddleware} = createHearMiddleware()

    middlewares.register(hearMiddleware)

    _.assign(this, {
      dataLocation,
      isFirstRun,
      version,
      logger,
      security, // login, authenticate, getSecret
      events,
      notifications,    // load, save, send
      about,
      middlewares,
      hear,
      licensing,
      modules,
      db
    })

    const loadedModules = modules._load(moduleDefinitions, this)

    this.stats.track('bot', 'modules', 'loaded', loadedModules.length)

    _.assign(this, {
      _loadedModules: loadedModules
    })

    const server = new WebServer({ botpress: this })
    server.start()

    const projectEntry = require(projectLocation)
    if (typeof(projectEntry) === 'function') {
      projectEntry.call(projectEntry, this)
    } else {
      logger.error('[FATAL] The bot entry point must be a function that takes an instance of bp')
      process.exit(1)
    }

    process.on('uncaughtException', err => {
      logger.error('(fatal) An unhandled exception occured in your bot', err)
      if (isDeveloping) {
        logger.error(err.stack)
      }

      this.stats.trackException(err.message)
      process.exit(1)
    })

    process.on('unhandledRejection', (reason, p) => {
      logger.error('Unhandled Rejection in Promise: ', p, 'Reason:', reason)

      this.stats.trackException(reason)
      if (isDeveloping && reason && reason.stack) {
        logger.error(reason.stack)
      }
    })
  }

  start() {
    if (cluster.isMaster) {
      cluster.fork()

      cluster.on('exit', (worker, code /* , signal */) => {
        if (code === RESTART_EXIT_CODE) {
          cluster.fork()

          this.stats.track('bot', 'restarted')
          print('info', '*** restarted worker process ***')
        } else {
          process.exit(code)
        }
      })
    }

    if (cluster.isWorker) {
      this._start()
    }
  }

  restart(interval = 0) {
    setTimeout(() => {
      process.exit(RESTART_EXIT_CODE)
    }, interval)
  }
}

module.exports = botpress
