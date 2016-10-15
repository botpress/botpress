const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const chalk = require('chalk')
const domain = require('domain')

const WebServer = require('./server')
const applyEngine = require('./engine')
const EventBus = require('./bus')

const { print, resolveFromDir, isDeveloping, resolveModuleRootPath } = require('./util')

class skin {
  constructor({ botfile }) {
    this.projectLocation = path.dirname(botfile)
    this.botfile = require(botfile)
  }

  _scanModules() {
    const packagePath = path.join(this.projectLocation, 'package.json')

    if(!fs.existsSync(packagePath)) {
      return print('warn', "No package.json found at project root, " +
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

      if(typeof loader !== 'function') {
        return print('warn', 'Ignoring module ' + mod.name +
          ', invalid entry point signature.')
      }

      mod.handlers = loader(this)
      this.modules[mod.name] = mod
      loadedCount++
    })

    if(loadedCount > 0) {
      print(`loaded ${chalk.bold(loadedCount)} modules`)
    }
  }

  start() {
    // change the current working directory to skin's installation path
    // the bot's location is kept in this.projectLocation
    process.chdir(path.join(__dirname, '../'))
    const modules = this._scanModules()

    // initialize event bus
    this.events = new EventBus()

    applyEngine(this)
    this._loadModules(modules)


    const server = this.server = new WebServer({ skin: this })
    server.start()

    // load the bot's entry point
    const projectLocation = this.projectLocation
    const botDomain = domain.create()
    const self = this

    botDomain.on('error', function(err) {
      print('error', '(fatal) An unhandled exception occured in your bot')
      print('error', err)
      if (isDeveloping) {
        print('error', err.stack)
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
