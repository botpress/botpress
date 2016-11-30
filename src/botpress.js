import 'source-map-support/register'

import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import domain from 'domain'
import cluster from 'cluster'

import WebServer from './server'
import applyEngine from './engine'
import EventBus from './bus'
import createLogger from './logger'
import createSecurity from './security'
import createNotif from './notif'
import Listeners from './listeners'
import Database from './database'
import Module from './module'
import Licensing from './licensing'
import Bot from './bot'
import {scanModules, loadModules} from './module_loader'

import {
  isDeveloping,
  print
} from './util'

const RESTART_EXIT_CODE = 107

const getVersion = () => {
  const botpressPackagePath = path.join(__dirname, '../package.json')
  const botpressJson = JSON.parse(fs.readFileSync(botpressPackagePath))
  return botpressJson.version
}

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
    this.version = getVersion()

    /**
     * The project location, which is the folder where botfile.js located
     */
    this.projectLocation = path.dirname(botfile)

    /**
     * The botfile config object
     */
    this.botfile = require(botfile)
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
    // change the current working directory to botpress's installation path
    // the bot's location is kept in this.projectLocation
    process.chdir(path.join(__dirname, '../'))

    const {projectLocation, botfile} = this

    const dataLocation = getDataLocation(botfile.dataDir, projectLocation)
    const logger = createLogger(dataLocation, botfile.log)
    mkdirIfNeeded(dataLocation, logger)

    const security = createSecurity(dataLocation, botfile.login)

    const modules = scanModules(projectLocation, logger)
    const events = new EventBus()
    const notifications = createNotif(dataLocation, botfile.notification, events, logger)
    const about = Bot(projectLocation, logger)

    _.assign(this, {
      dataLocation,
      logger,
      security, // login, authenticate, getSecret
      events,
      notifications,    // load, save, send
      about
      // TODO To be continued
    })

    // ----- the following haven't been finished -----
    applyEngine(this)

    this.hear = (condition, callback) => {
      this.incoming(Listeners.hear(condition, callback))
    }

    const dbLocation = path.join(this.dataLocation, 'db.sqlite')
    this.db = Database(dbLocation)

    this.module = Module(this)
    this.licensing = Licensing(this)

    this.modules = loadModules(modules, this, logger)

    const server = this.server = new WebServer({ botpress: this })
    server.start()

    // load the bot's entry point
    const botDomain = domain.create()
    const self = this

    botDomain.on('error', function(err) {
      self.logger.error('(fatal) An unhandled exception occured in your bot', err)
      if (isDeveloping) {
        self.logger.error(err.stack)
      }
      return process.exit(1)
    })

    botDomain.run(function() {
      const projectEntry = require(projectLocation)
      if (typeof(projectEntry) === 'function') {
        projectEntry.call(projectEntry, self)
      }
    })
  }

  start() {
    if (cluster.isMaster) {
      cluster.fork()

      cluster.on('exit', (worker, code /* , signal */) => {
        if (code === RESTART_EXIT_CODE) {
          cluster.fork()
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
