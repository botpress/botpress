const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const chalk = require('chalk')

const WebServer = require('./server')
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

  loadModules() {
    const modules = this._scanModules()
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
    process.chdir(path.join(__dirname, '..'))

    this.loadModules()

    // load the bot's entry point
    try {
      const projectEntry = require(this.projectLocation)
      if (typeof(projectEntry) === 'function') {
        projectEntry.call(projectEntry, this)
      }
    } catch (err) {
      print('error', "(fatal) Could not load the bot's main module. " +
        "Please make sure the entry point (main) is valid in your package.json file.")
      return process.exit(1)
    }

    const server = this.server = new WebServer({ skin: this })
    server.start()
  }
}

module.exports = skin;
