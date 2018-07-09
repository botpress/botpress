import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'
import _ from 'lodash'
import axios from 'axios'
import helpers from './helpers'
import util from './util'

import { isDeveloping, resolveModuleRootPath, resolveFromDir, resolveProjectFile } from './util'

module.exports = (logger, projectLocation, dataLocation, configManager) => {
  const loadModules = async (moduleDefinitions, botpress) => {
    let loadedCount = 0
    const loadedModules = {}

    await Promise.mapSeries(moduleDefinitions, async mod => {
      let loader = null
      try {
        loader = require(mod.entry)
      } catch (err) {
        return logger.error(`Error loading module "${mod.name}": ` + err.message)
      }

      if (typeof loader !== 'object') {
        return logger.warn(`Ignoring module ${mod.name}. Invalid entry point signature.`)
      }

      mod.handlers = loader

      try {
        const configuration = configManager.getModuleConfiguration({
          name: mod.name,
          options: loader.config,
          path: mod.root
        })

        if (await configuration.isConfigMissing()) {
          await configuration.bootstrap()
        }

        mod.configuration = configuration
      } catch (err) {
        logger.error(`Invalid module configuration in module ${mod.name}:`, err)
      }

      try {
        loader.init && (await loader.init(botpress, mod.configuration, helpers))
      } catch (err) {
        logger.warn('Error during module initialization: ', err)
      }

      loadedModules[mod.name] = mod
      logger.info(`Loaded ${mod.name}, version ${mod.version}`)
      loadedCount++
    })

    if (loadedCount > 0) {
      logger.info(`Loaded ${loadedCount} modules`)
    }

    return loadedModules
  }

  const scanModules = () => {
    const packagePath = path.join(projectLocation, 'package.json')

    if (!fs.existsSync(packagePath)) {
      return logger.warn(
        'No package.json found at project root, ' + "which means botpress can't load any module for the bot."
      )
    }

    const botPackage = require(packagePath)

    let deps = botPackage.dependencies || {}
    if (isDeveloping) {
      deps = _.merge(deps, botPackage.devDependencies || {})
    }

    return _.reduce(
      deps,
      (result, value, key) => {
        if (!util.isBotpressPackage(key)) {
          return result
        }
        const entry = resolveFromDir(projectLocation, key)
        if (!entry) {
          return result
        }
        const root = resolveModuleRootPath(entry)
        if (!root) {
          return result
        }

        const modulePackage = require(path.join(root, 'package.json'))
        if (!modulePackage.botpress) {
          return result
        }

        return (
          result.push({
            name: key,
            root: root,
            homepage: modulePackage.homepage,
            settings: modulePackage.botpress,
            version: modulePackage.version,
            entry: entry
          }) && result
        )
      },
      []
    )
  }

  const listInstalledModules = () => {
    const packagePath = resolveProjectFile('package.json', projectLocation, true)
    const { dependencies } = require(packagePath)
    const prodDeps = _.keys(dependencies)

    return _.filter(prodDeps, util.isBotpressPackage)
  }

  const getRandomCommunityHero = Promise.method(() =>
    axios
      .get('https://api.github.com/repos/botpress/botpress/contributors')
      .then(({ data: contributors }) => {
        const { login: username, html_url: github, avatar_url: avatar, contributions } = _.sample(contributors)
        return { username, github, avatar, contributions, module: 'botpress' }
      })
      .catch(() =>
        Promise.resolve({
          username: 'danyfs',
          github: 'https://github.com/danyfs',
          avatar: 'https://avatars1.githubusercontent.com/u/5629987?v=3',
          contributions: 'many',
          module: 'botpress'
        })
      )
  )

  return {
    getRandomCommunityHero,
    listInstalled: listInstalledModules,
    _scan: scanModules,
    _load: loadModules
  }
}
