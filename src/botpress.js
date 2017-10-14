import 'source-map-support/register'

import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import cluster from 'cluster'
import dotenv from 'dotenv'

import ServiceLocator from '+/ServiceLocator'
import EventBus from './bus'

import createMiddlewares from './middlewares'
import createLogger from './logger'
import createSecurity from './security'
import createNotifications from './notifications'
import createHearMiddleware from './hear'
import createFallbackMiddleware from './fallback'
import createDatabase from './database'
import createLicensing from './licensing'
import createAbout from './about'
import createModules from './modules'
import createUMM from './umm'
import createUsers from './users'
import createContentManager from './content/service'
import createFlowEngine from './flow'
import createConversations from './conversations'
import stats from './stats'
import packageJson from '../package.json'
import createEmails from '+/emails'
import createMediator from '+/mediator'

import createServer from './server'

import { getBotpressVersion } from './util'

import { isDeveloping, print } from './util'

const RESTART_EXIT_CODE = 107

const getDataLocation = (dataDir, projectLocation) =>
  dataDir && path.isAbsolute(dataDir) ? path.resolve(dataDir) : path.resolve(projectLocation, dataDir || 'data')

const mkdirIfNeeded = (path, logger) => {
  if (!fs.existsSync(path)) {
    logger.info(`Creating data directory: ${path}`)

    try {
      fs.mkdirSync(path)
    } catch (err) {
      logger.error(`[FATAL] Error creating directory: ${err.message}`)
      process.exit(1)
    }
  }
}

/**
 * Global context botpress
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
     * Setup env with dotenv *before* requiring the botfile config
     */
    this._setupEnv()

    /**
     * The botfile config object
     */
    this.botfile = eval('require')(botfile)

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
  async _start() {
    this.stats.track('bot', 'started')

    if (!this.interval) {
      this.interval = setInterval(() => {
        this.stats.track('bot', 'running')
      }, 30 * 1000)
    }

    // change the current working directory to botpress's installation path
    // the bot's location is kept in this.projectLocation
    process.chdir(path.join(__dirname, '../'))

    const { projectLocation, botfile } = this

    const isFirstRun = fs.existsSync(path.join(projectLocation, '.welcome'))
    const dataLocation = getDataLocation(botfile.dataDir, projectLocation)
    const modulesConfigDir = getDataLocation(botfile.modulesConfigDir, projectLocation)
    const dbLocation = path.join(dataLocation, 'db.sqlite')
    const version = packageJson.version

    const logger = createLogger(dataLocation, botfile.log)
    mkdirIfNeeded(dataLocation, logger)
    mkdirIfNeeded(modulesConfigDir, logger)

    logger.info(`Starting botpress version ${version}`)

    const db = createDatabase({
      sqlite: { location: dbLocation },
      postgres: botfile.postgres
    })

    const security = createSecurity({
      dataLocation,
      securityConfig: botfile.login,
      db
    })

    const modules = createModules(logger, projectLocation, dataLocation, db.kvs)

    const moduleDefinitions = modules._scan()

    const events = new EventBus()

    const notifications = createNotifications({ knex: await db.get(), modules: moduleDefinitions, logger, events })
    const about = createAbout(projectLocation)
    const licensing = createLicensing({ logger, projectLocation, version, db, botfile })
    const middlewares = createMiddlewares(this, dataLocation, projectLocation, logger)
    const { hear, middleware: hearMiddleware } = createHearMiddleware()
    const { middleware: fallbackMiddleware } = createFallbackMiddleware(this)
    const emails = createEmails({ emailConfig: botfile.emails })
    const mediator = createMediator(this)
    const convo = createConversations({ logger, middleware: middlewares })
    const users = createUsers({ db })
    const contentManager = createContentManager({ db, logger, projectLocation, botfile })
    const umm = createUMM({ logger, middlewares, projectLocation, botfile, db, contentManager })
    const flowEngine = createFlowEngine({ logger, projectLocation, botfile })

    middlewares.register(umm.incomingMiddleware)
    middlewares.register(hearMiddleware)
    middlewares.register(fallbackMiddleware)

    _.assign(this, {
      dataLocation,
      isFirstRun,
      version,
      logger,
      security, // login, authenticate, getSecret
      events,
      notifications, // load, save, send
      about,
      middlewares,
      hear,
      licensing,
      modules,
      db,
      emails,
      mediator,
      convo,
      umm,
      users,
      contentManager,
      flowEngine
    })

    ServiceLocator.init({ bp: this })

    const loadedModules = modules._load(moduleDefinitions, this)

    this.stats.track('bot', 'modules', 'loaded', loadedModules.length)

    _.assign(this, {
      _loadedModules: loadedModules
    })

    contentManager.scanAndRegisterCategories()

    mediator.install()
    notifications._bindEvents()

    const server = createServer(this)
    server.start().then(() => {
      events.emit('ready')
      for (let mod of _.values(loadedModules)) {
        mod.handlers.ready && mod.handlers.ready(this, mod.configuration)
      }

      const { port } = botfile
      logger.info(chalk.green.bold('Bot launched. Visit: http://localhost:' + port))
    })

    const middlewareAutoLoading = _.get(botfile, 'middleware.autoLoading')
    if (!_.isNil(middlewareAutoLoading) && middlewareAutoLoading === false) {
      logger.debug('Middleware Auto Loading was disabled. Call bp.middlewares.load() manually.')
    } else {
      middlewares.load()
    }

    const projectEntry = eval('require')(projectLocation)
    if (typeof projectEntry === 'function') {
      projectEntry.call(projectEntry, this)
    } else {
      logger.error('[FATAL] The bot entry point must be a function that takes an instance of bp')
      process.exit(1)
    }

    process.on('uncaughtException', err => {
      logger.error('[FATAL] An unhandled exception occurred in your bot', err)
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

  _setupEnv() {
    const envPath = path.resolve(this.projectLocation, '.env')
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath))
      for (var k in envConfig) {
        if (_.isNil(process.env[k]) || process.env.ENV_OVERLOAD) {
          process.env[k] = envConfig[k]
        }
      }
    }
  }
}

module.exports = botpress
