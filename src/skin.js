import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import domain from 'domain'
import WebServer from './server'
import applyEngine from './engine'
import EventBus from './bus'
import NotificationProvider from './notif'
import Logger from './logger'
import Security from './security'

import { resolveFromDir, isDeveloping, resolveModuleRootPath } from './util'

class skin {
  constructor({ botfile }) {
    this.projectLocation = path.dirname(botfile)
    this.botfile = require(botfile)
  }

  _resolvePaths() {
    this.dataLocation =
      this.botfile.dataDir && path.isAbsolute(this.botfile.dataDir)
      ? path.resolve(this.botfile.dataDir)
      : path.resolve(this.projectLocation, this.botfile.dataDir || 'data')

    if(!fs.existsSync(this.dataLocation)) {
      this.logger.info('creating data directory: ' + this.dataLocation)
      try {
        fs.mkdirSync(this.dataLocation)
      } catch(err) {
        this.logger.error('(fatal) error creating directory: ', err.message)
        process.exit(1)
      }
    }
  }

  _scanModules() {
    const packagePath = path.join(this.projectLocation, 'package.json')

    if(!fs.existsSync(packagePath)) {
      return this.logger.warn("No package.json found at project root, " +
        "which means skin can't load any module for the bot.")
    }

    const botPackage = require(packagePath)

    let deps = botPackage.dependencies || {}
    if(isDeveloping) {
      deps = _.merge(deps, botPackage.devDependencies || {})
    }

    return _.reduce(deps, (result, value, key) => {
      if(!/^skin-/i.test(key)) {
        return result
      }
      const entry = resolveFromDir(this.projectLocation, key)
      if(!entry) {
        return result
      }
      const root = resolveModuleRootPath(entry)
      if(!root) {
        return result
      }

      const modulePackage = require(path.join(root, 'package.json'))
      if(!modulePackage.botskin) {
        return result
      }

      return result.push({
        name: key,
        root: root,
        settings: modulePackage.botskin,
        entry: entry
      }) && result
    }, [])
  }

  _loadModules(modules) {
    let loadedCount = 0
    this.modules = {}

    modules.forEach((mod) => {
      const loader = require(mod.entry)

      if(typeof loader !== 'object') {
        return this.logger.warn('Ignoring module ' + mod.name +
          ', invalid entry point signature.')
      }

      mod.handlers = loader

      try {
        loader.init && loader.init(this)
      } catch (err) {
        this.logger.warn('Error during module initialization: ', err)
      }

      this.modules[mod.name] = mod
      loadedCount++
    })

    if(loadedCount > 0) {
      this.logger.info(`loaded ${loadedCount} modules`)
    }
  }

  start() {
    // change the current working directory to skin's installation path
    // the bot's location is kept in this.projectLocation
    process.chdir(path.join(__dirname, '../'))

    const logger = this.logger = Logger(this)

    this._resolvePaths()

    if (!this.botfile.disableFileLogs) {
      logger.enableFileTransport()
    }

    Security(this)

    const modules = this._scanModules()

    // initialize event bus
    this.events = new EventBus()
    NotificationProvider(this, modules)

    applyEngine(this)

    this._loadModules(modules)

    const server = this.server = new WebServer({ skin: this })
    server.start()

    // load the bot's entry point
    const projectLocation = this.projectLocation
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
}

module.exports = skin;
