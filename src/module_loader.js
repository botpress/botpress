import path from 'path'
import fs from 'fs'
import _ from 'lodash'

import {
  resolveFromDir,
  isDeveloping,
  resolveModuleRootPath,
} from './util'

export const scanModules = (projectLocation, logger) => {
  const packagePath = path.join(projectLocation, 'package.json')

  if (!fs.existsSync(packagePath)) {
    return logger.warn("No package.json found at project root, " +
      "which means botpress can't load any module for the bot.")
  }

  const botPackage = require(packagePath)

  let deps = botPackage.dependencies || {}
  if (isDeveloping) {
    deps = _.merge(deps, botPackage.devDependencies || {})
  }

  return _.reduce(deps, (result, value, key) => {
    if (!/^botpress-/i.test(key)) {
      return result
    }
    const entry = resolveFromDir(this.projectLocation, key)
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

    return result.push({
      name: key,
      root: root,
      homepage: modulePackage.homepage,
      settings: modulePackage.botpress,
      entry: entry
    }) && result
  }, [])
}

export const loadModules = (modules, botpress, logger) => {
  let loadedCount = 0
  const loadedModules = {}

  modules.forEach((mod) => {
    const loader = require(mod.entry)

    if (typeof loader !== 'object') {
      return logger.warn('Ignoring module ' + mod.name +
        ', invalid entry point signature.')
    }

    mod.handlers = loader

    try {
      loader.init && loader.init(botpress)
    } catch (err) {
      logger.warn('Error during module initialization: ', err)
    }

    loadedModules[mod.name] = mod
    loadedCount++
  })

  if (loadedCount > 0) {
    logger.info(`loaded ${loadedCount} modules`)
  }

  return loadedModules
}
