import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'
import _ from 'lodash'

import  { print, isDeveloping } from './util'

module.exports = (bp) => {

  const log = (level, ...args) => {
    if (bp && bp.logger[level]) {
      bp.logger[level].apply(this, args)
    } else {
      print.apply(this, [level, ...args])
    }
  }

  const listAllModules = () => {
    return [
      {
        name: 'Messenger',
        stars: 5000,
        docLink: 'http://www.github.com/botpress/botpress-messenger',
        icon: 'message',
        description: 'Official Facebook Messenger module for botpress',
        downloads: 3000,
        installed: true,
        license: 'AGPL-3',
        author: 'Sylvain Perron and Dany Fortin-Simard'
      },
      {
        name: 'Analytics',
        stars: 32342,
        docLink: 'http://www.github.com/botpress/botpress-messenger',
        icon: 'message',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        downloads: 45006,
        installed: false,
        license: 'Proprietery',
        author: 'Dany Fortin-Simard'
      },
      {
        name: 'RiveScript',
        stars: 24,
        docLink: 'http://www.github.com/botpress/botpress-messenger',
        icon: 'message',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        downloads: 3000,
        installed: true,
        license: 'AGPL-3',
        author: 'Sylvain Perron'
      }
    ]
  }

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
        process.stdout.write(data.toString())
      })

      command.stderr.on('data', (data) => {
        process.stderr.write(data.toString())
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

    const install = spawn('npm', ['install', '--save', ...modules])

    log('info', 'Installing modules: ' + modules.join(', '))

    return runSpawn(install)
    .then(() => log('success', 'Modules successfully installed'))
    .catch(() => log('error', 'An error occured during modules installation.'))
  })

  const uninstallModules = Promise.method((...names) => {
    let modules = resolveModuleNames(names)

    const uninstall = spawn('npm', ['uninstall', '--save', ...modules])

    log('info', 'Uninstalling modules: ' + modules.join(', '))

    return runSpawn(uninstall)
    .then(() => log('success', 'Modules successfully removed'))
    .catch(() => log('error', 'An error occured during modules removal.'))
  })

  const listInstalledModules = () => {
    let projectLocation = (bp && bp.projectLocation) || './'
    let packagePath = path.resolve(projectLocation, './package.json')

    if (!fs.existsSync(packagePath)) {
      log('warn', 'Could not find bot\'s package.json file')
      return []
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath))
    const prodDeps = _.keys(packageJson.dependencies)

    return _.filter(prodDeps, dep => /botpress-.+/i.test(dep))
  }

  return {
    getInstalled: listInstalledModules,
    get: listAllModules,
    install: installModules,
    uninstall: uninstallModules
  }
}
