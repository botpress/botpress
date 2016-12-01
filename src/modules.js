import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'
import _ from 'lodash'
import moment from 'moment'
import axios from 'axios'

import {
  print,
  isDeveloping,
  npmCmd,
  resolveModuleRootPath,
  resolveFromDir,
  resolveProjectFile
} from './util'

const MODULES_URL = 'https://s3.amazonaws.com/botpress-io/all-modules.json'
const POPULAR_URL = 'https://s3.amazonaws.com/botpress-io/popular-modules.json'
const FEATURED_URL = 'https://s3.amazonaws.com/botpress-io/featured-modules.json'

module.exports = (logger, projectLocation, dataLocation) => {

  const log = (level, ...args) => {
    if (logger && logger[level]) {
      logger[level].apply(this, args)
    } else {
      print.apply(this, [level, ...args])
    }
  }

  const fetchAllModules = () => {
    return axios.get(MODULES_URL)
    .then(({ data }) => data)
  }

  const fetchPopular = () => {
    return axios.get(POPULAR_URL)
    .then(({ data }) => data)
  }

  const fetchFeatured = () => {
    return axios.get(FEATURED_URL)
    .then(({ data }) => data)
  }

  const loadModules = (moduleDefinitions, botpress) => {
    let loadedCount = 0
    const loadedModules = {}

    moduleDefinitions.forEach(mod => {
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

  const scanModules = () => {
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

      return result.push({
        name: key,
        root: root,
        homepage: modulePackage.homepage,
        settings: modulePackage.botpress,
        entry: entry
      }) && result
    }, [])
  }

  const getRandomCommunityHero = Promise.method(() => {
    const modulesCachePath = path.join(dataLocation, './modules-cache.json')

    return listAllCommunityModules()
    .then(() => {
      const { modules } = JSON.parse(fs.readFileSync(modulesCachePath))

      const module = _.sample(modules)
      const hero = _.sample(module.contributors)

      return {
        username: hero.login,
        github: hero.html_url,
        avatar: hero.avatar_url,
        contributions: hero.contributions,
        module: module.name
      }
    })
  })

  const mapModuleList = (modules) => {
    const installed = listInstalledModules()
    return modules.map(mod => ({
      name: mod.name,
      stars: mod.github.stargazers_count,
      forks: mod.github.forks_count,
      docLink: mod.homepage,
      version: mod['dist-tags'].latest,
      keywords: mod.keywords,
      fullName: mod.github.full_name,
      updated: mod.github.updated_at,
      issues: mod.github.open_issues_count,
      icon: mod.package.botpress.menuIcon,
      description: mod.description,
      installed: _.includes(installed, mod.name),
      license: mod.license,
      author: mod.author.name
    }))
  }

  const listAllCommunityModules = Promise.method(() => {

    if (!fs) {
      return [] // TODO Fetch & return
    }

    const modulesCachePath = path.join(dataLocation, './modules-cache.json')
    if (!fs.existsSync(modulesCachePath)) {
      fs.writeFileSync(modulesCachePath, JSON.stringify({
        modules: [],
        updated: null
      }))
    }

    const { modules, updated } = JSON.parse(fs.readFileSync(modulesCachePath))

    if (updated && moment().diff(moment(updated), 'minutes') <= 30) {
      return mapModuleList(modules)
    }

    return Promise.props({
      modules: fetchAllModules(),
      popular: fetchPopular(),
      featured: fetchFeatured()
    })
    .then(({ modules, featured, popular }) => {
      fs.writeFileSync(modulesCachePath, JSON.stringify({
        modules: modules,
        popular: popular,
        featured: featured,
        updated: new Date()
      }))

      return mapModuleList(modules)
    })
  })

  const listPopularCommunityModules = Promise.method(() => {
    const modulesCachePath = path.join(dataLocation, './modules-cache.json')

    return listAllCommunityModules()
    .then(modules => {
      const { popular } = JSON.parse(fs.readFileSync(modulesCachePath))
      return _.filter(modules, m => _.includes(popular, m.name))
    })
  })

  const listFeaturedCommunityModules = Promise.method(() => {
    const modulesCachePath = path.join(dataLocation, './modules-cache.json')

    return listAllCommunityModules()
    .then(modules => {
      const { featured } = JSON.parse(fs.readFileSync(modulesCachePath))
      return _.filter(modules, m => _.includes(featured, m.name))
    })
  })

  const resolveModuleNames = (names) => {
    return names.map(name => {
      if (!name || typeof(name) !== 'string') {
        throw new TypeError('Expected module name to be a string')
      }

      let basename = path.basename(name)
      let prefix = ''

      if (basename !== name) {
        prefix = name.substr(0, name.length - basename.length)
      }

      if (basename.replace(/botpress-?/i, '').length === 0) {
        throw new Error('Invalid module name: ' + basename)
      }

      if (!/^botpress-/i.test(basename)) {
        basename = 'botpress-' + basename
      }

      return prefix + basename
    })
  }

  const runSpawn = (command) => {
    return new Promise((resolve, reject) => {
      command.stdout.on('data', (data) => {
        log('info', data.toString())
      })

      command.stderr.on('data', (data) => {
        log('error', data.toString())
      })

      command.on('close', (code) => {
        if (code > 0) {
          reject()
        } else {
          resolve()
        }
      })
    })
  }

  const installModules = Promise.method((...names) => {
    let modules = resolveModuleNames(names)

    const install = spawn(npmCmd, ['install', '--save', ...modules], {
      cwd: projectLocation
    })

    log('info', 'Installing modules: ' + modules.join(', '))

    return runSpawn(install)
    .then(() => log('success', 'Modules successfully installed'))
    .catch(err => {
      log('error', 'An error occured during modules installation.')
      throw err
    })
  })

  const uninstallModules = Promise.method((...names) => {
    let modules = resolveModuleNames(names)
    const uninstall = spawn(npmCmd, ['uninstall', '--save', ...modules], {
      cwd: projectLocation
    })

    log('info', 'Uninstalling modules: ' + modules.join(', '))

    return runSpawn(uninstall)
    .then(() => log('success', 'Modules successfully removed'))
    .catch(err => {
      log('error', 'An error occured during modules removal.')
      throw err
    })
  })


  const listInstalledModules = () => {
    const packagePath = resolveProjectFile('package.json', projectLocation, true)
    const { dependencies } = JSON.parse(fs.readFileSync(packagePath))
    const prodDeps = _.keys(dependencies)

    return _.filter(prodDeps, dep => /botpress-.+/i.test(dep))
  }

  return {
    listAllCommunityModules,
    listPopularCommunityModules,
    listFeaturedCommunityModules,
    getRandomCommunityHero,
    install: installModules,
    uninstall: uninstallModules,
    listInstalled: listInstalledModules,
    _scan: scanModules,
    _load: loadModules
  }
}
