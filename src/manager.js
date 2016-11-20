import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'
import _ from 'lodash'
import moment from 'moment'
import axios from 'axios'

import  { print, isDeveloping } from './util'

const MODULES_URL = 'https://s3.amazonaws.com/botpress-io/all-modules.json'
const POPULAR_URL = 'https://s3.amazonaws.com/botpress-io/popular-modules.json'
const FEATURED_URL = 'https://s3.amazonaws.com/botpress-io/featured-modules.json'

module.exports = (bp) => {

  const log = (level, ...args) => {
    if (bp && bp.logger[level]) {
      bp.logger[level].apply(this, args)
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

  const getRandomHero = () => {
    const modulesCachePath = path.join(bp.dataLocation, './modules-cache.json')

    return listAllModules()
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
  }

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

  const listAllModules = Promise.method(() => {

    if (!fs) {
      return [] // TODO Fetch & return
    }

    const modulesCachePath = path.join(bp.dataLocation, './modules-cache.json')
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

  const listPopularModules = Promise.method(() => {
    const modulesCachePath = path.join(bp.dataLocation, './modules-cache.json')

    return listAllModules()
    .then(modules => {
      const { popular } = JSON.parse(fs.readFileSync(modulesCachePath))
      return _.filter(modules, m => _.includes(popular, m.name))
    })
  })

  const listFeaturedModules = Promise.method(() => {
    const modulesCachePath = path.join(bp.dataLocation, './modules-cache.json')

    return listAllModules()
    .then(modules => {
      const { featured } = JSON.parse(fs.readFileSync(modulesCachePath))
      return _.filter(modules, m => _.includes(featured, m.name))
    })
  })

  const getInformation = Promise.method(() => {
    const packageJson = readPackage()

    return getRandomHero()
    .then(hero => ({
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description || 'No description',
      author: packageJson.author || '<no author>',
      license: packageJson.license || 'AGPL-v3.0',
      hero: hero
    }))
  })

  const getContributor = () => {
    return {
      message: "Thanks to <strong>Sylvain Perron</strong> for his contribution on <strong>botpress-messenger</strong>!",
      img: "https://avatars.githubusercontent.com/u/1315508?v=3"
    }
  }

  const licensesPath = path.join(__dirname, '../licenses')

  const getPackageJSONPath = () => {
    let projectLocation = (bp && bp.projectLocation) || './'
    let packagePath = path.resolve(projectLocation, './package.json')

    if (!fs.existsSync(packagePath)) {
      log('warn', 'Could not find bot\'s package.json file')
      return []
    }

    return packagePath
  }

  const getLicensePath = () => {
    let projectLocation = (bp && bp.projectLocation) || './'
    let licensePath = path.resolve(projectLocation, './LICENSE')

    if (!fs.existsSync(licensePath)) {
      log('warn', 'Could not find bot\'s license file')
      return []
    }

    return licensePath
  }

  const getLicenses = () => {
    const packageJSON = JSON.parse(fs.readFileSync(getPackageJSONPath()))
    const actualLicense = packageJSON.license
    const licenseAGPL = fs.readFileSync(path.join(licensesPath, 'LICENSE_AGPL3')).toString()
    const licenseBotpress = fs.readFileSync(path.join(licensesPath, 'LICENSE_BOTPRESS')).toString()

    return {
      agpl: {
        name: 'AGPL-3.0',
        licensedUnder: actualLicense === 'AGPL-3.0',
        text: licenseAGPL
      },
      botpress: {
        name: 'Botpress',
        licensedUnder: actualLicense === 'Botpress',
        text: licenseBotpress
      }
    }
  }

  const changeLicense = Promise.method((license) => {
    const licenseFile = (license === 'AGPL-3.0') ? 'LICENSE_AGPL3' : 'LICENSE_BOTPRESS'
    const licenseContent = fs.readFileSync(path.join(licensesPath, licenseFile))
    fs.writeFileSync(getLicensePath(), licenseContent)

    let packageJSON = JSON.parse(fs.readFileSync(getPackageJSONPath()))
    packageJSON.license = license

    fs.writeFileSync(getPackageJSONPath(), JSON.stringify(packageJSON))
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

    const install = spawn('npm', ['install', '--save', ...modules], {
      cwd: bp && bp.projectLocation
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

    const uninstall = spawn('npm', ['uninstall', '--save', ...modules], {
      cwd: bp && bp.projectLocation
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
    const packageJSON = JSON.parse(fs.readFileSync(getPackageJSONPath()))
    const prodDeps = _.keys(packageJSON.dependencies)

    return _.filter(prodDeps, dep => /botpress-.+/i.test(dep))
  }

  return {
    getInstalled: listInstalledModules,
    get: listAllModules,
    getPopular: listPopularModules,
    getFeatured: listFeaturedModules,
    getInformation: getInformation,
    getLicenses: getLicenses,
    changeLicense: changeLicense,
    getContributor: getContributor,
    install: installModules,
    uninstall: uninstallModules
  }
}
