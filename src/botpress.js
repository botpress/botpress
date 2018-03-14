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
import createGhostManager from './ghost-content'
import createMediaManager from './media-manager'
import createLicensing from './licensing'
import createAbout from './about'
import createModules from './modules'
import createRenderers from './renderers'
import createUsers from './users'
import createContentManager from './content/service'
import defaultGetItemProviders from './content/getItemProviders'
import FlowProvider from './dialog/provider'
import StateManager from './dialog/state'
import DialogEngine from './dialog/engine'
import DialogProcessors from './dialog/processors'
import DialogJanitor from './dialog/janitor'
import SkillsManager from './skills'
import createHelpers from './helpers'
import stats from './stats'
import packageJson from '../package.json'
import createEmails from '+/emails'
import createMediator from '+/mediator'

import createServer from './server'
import Queue from '+/queue'

import { getDataLocation, getBotpressVersion } from './util'

import { isDeveloping, print } from './util'

const RESTART_EXIT_CODE = 107

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

const REQUIRED_PROPS = ['botUrl']

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
    // eslint-disable-next-line no-eval
    this.botfile = eval('require')(botfile)

    for (const prop of REQUIRED_PROPS) {
      if (!(prop in this.botfile)) {
        throw new Error(`Missing required botpress setting: ${prop}`)
      }
    }

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
      projectLocation,
      db
    })

    const modules = createModules(logger, projectLocation, dataLocation, db.kvs)

    const moduleDefinitions = modules._scan()

    const events = new EventBus()

    const notifications = createNotifications({
      knex: await db.get(),
      modules: moduleDefinitions,
      logger,
      events
    })
    const about = createAbout(projectLocation)
    const licensing = createLicensing({
      logger,
      projectLocation,
      version,
      db,
      botfile,
      bp: this
    })
    const middlewares = createMiddlewares(this, dataLocation, projectLocation, logger)
    const { hear, middleware: hearMiddleware } = createHearMiddleware()
    const { middleware: fallbackMiddleware } = createFallbackMiddleware(this)
    const emails = createEmails({ emailConfig: botfile.emails })
    const mediator = createMediator(this)

    const users = createUsers({ db })
    const ghostManager = createGhostManager({
      projectLocation,
      logger,
      db,
      enabled: !!_.get(botfile, 'ghostContent.enabled')
    })
    const contentManager = await createContentManager({
      logger,
      projectLocation,
      botfile,
      ghostManager
    })
    const mediaManager = await createMediaManager({
      botfile,
      logger,
      ghostManager,
      projectLocation
    })

    // Register the built-in item providers such as "-random()"
    Object.keys(defaultGetItemProviders).forEach(provider => {
      contentManager.registerGetItemProvider(provider, defaultGetItemProviders[provider])
    })

    const renderers = createRenderers({
      logger,
      middlewares,
      db,
      contentManager,
      botfile
    })

    const stateManager = StateManager({ db })
    const flowProvider = new FlowProvider({ logger, projectLocation, botfile, ghostManager })
    const dialogJanitor = new DialogJanitor({ db, middlewares, botfile })
    const dialogEngine = new DialogEngine({ flowProvider, stateManager, logger })

    const skillsManager = new SkillsManager({ logger })

    dialogEngine.onError(({ message }) =>
      notifications.create({ message: `DialogEngine: ${message}`, level: 'error', redirectUrl: '/logs' })
    )

    // Registers the default output processor, which sends messages to the user
    dialogEngine.registerOutputProcessor(DialogProcessors['default'])
    dialogJanitor.install()

    const incomingQueue = new Queue('Incoming', logger, {
      redis: botfile.redis
    })
    incomingQueue.subscribe(job => middlewares.sendIncomingImmediately(job.event))

    const outgoingQueue = new Queue('Outgoing', logger, {
      redis: botfile.redis
    })
    outgoingQueue.subscribe(job => middlewares.sendOutgoingImmediately(job.event))

    const messages = {
      in: {
        enqueue: event => incomingQueue.enqueue({ event }),
        cancelAll: event => incomingQueue.cancelAll({ event }),
        peek: event => incomingQueue.peek({ event })
      },
      out: {
        enqueue: event => outgoingQueue.enqueue({ event }),
        cancelAll: event => outgoingQueue.cancelAll({ event }),
        peek: event => outgoingQueue.peek({ event })
      }
    }

    middlewares.register(renderers.incomingMiddleware)
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
      renderers,
      get umm() {
        logger.warn(
          'DEPRECATION NOTICE – bp.umm is deprecated and will be removed in `botpress@3.0` – Please see bp.renderers instead.'
        )
        return renderers
      },
      users,
      ghostManager,
      contentManager,
      mediaManager,
      dialogEngine,
      dialogJanitor,
      messages,
      skills: skillsManager
    })

    ServiceLocator.init({ bp: this })

    const loadedModules = await modules._load(moduleDefinitions, this)

    this.stats.track('bot', 'modules', 'loaded', loadedModules.length)

    _.assign(this, {
      _loadedModules: loadedModules
    })

    skillsManager.registerSkillsFromModules(_.values(loadedModules))
    await contentManager.init()

    mediator.install()
    notifications._bindEvents()

    const server = createServer(this)
    server.start().then(srv => {
      this.stopServer = srv && srv.stop
      events.emit('ready')
      for (const mod of _.values(loadedModules)) {
        mod.handlers.ready && mod.handlers.ready(this, mod.configuration, createHelpers)
      }

      const { botUrl } = botfile
      logger.info(chalk.green.bold(`Bot launched. Visit: ${botUrl}`))
    })

    const middlewareAutoLoading = _.get(botfile, 'middleware.autoLoading')
    if (!_.isNil(middlewareAutoLoading) && middlewareAutoLoading === false) {
      logger.debug('Middleware Auto Loading was disabled. Call bp.middlewares.load() manually.')
    } else {
      middlewares.load()
    }

    // eslint-disable-next-line no-eval
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

  start = () => {
    if (cluster.isMaster) {
      let firstWorkerHasStartedAlready = false

      const quit = (code = 0) => {
        if (this.stopServer) {
          this.stopServer()
        }

        process.exit(code)
      }

      const receiveMessageFromWorker = message => {
        if (message && message.workerStatus === 'starting') {
          if (!firstWorkerHasStartedAlready) {
            firstWorkerHasStartedAlready = true
          } else {
            print('info', '*** restarted worker process ***')
            this.stats.track('bot', 'restarted')
          }
        } else if (message.type === 'exit') {
          quit()
        }
      }

      cluster.on('exit', (worker, code /* , signal */) => {
        if (code === RESTART_EXIT_CODE) {
          cluster.fork().on('message', receiveMessageFromWorker)
        } else {
          quit(code)
        }
      })

      cluster.fork().on('message', receiveMessageFromWorker)
    }

    if (cluster.isWorker) {
      process.send({ workerStatus: 'starting' })
      this._start().catch(err => {
        print('error', 'Error starting botpress: ', err.message, err.stack)
      })
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
      for (const k in envConfig) {
        if (_.isNil(process.env[k]) || process.env.ENV_OVERLOAD) {
          process.env[k] = envConfig[k]
        }
      }
    }
  }
}

module.exports = botpress
