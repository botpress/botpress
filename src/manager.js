import { spawn } from 'child_process'
import path from 'path'
import Promise from 'bluebird'

import  { isDeveloping } from './util'

const listAllModules = () => {
  return [
    {
      name: 'Messenger',
      stars: 5000,
      docLink: 'http://www.github.com/botpress/botpress-messenger',
      icon: 'message',
      description: 'Official Facebook Messenger module for botpress',
      license: 'AGPL-3.0',
      author: 'Sylvain Perron and Dany Fortin-Simard'
    },
    {
      name: 'Analytics',
      stars: 32342,
      docLink: 'http://www.github.com/botpress/botpress-messenger',
      icon: 'close',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      license: 'AGPL-3.0',
      author: 'Dany Fortin-Simard'
    },
    {
      name: 'RiveScript',
      stars: 24,
      docLink: 'http://www.github.com/botpress/botpress-messenger',
      icon: 'open',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      license: 'AGPL-3.0',
      author: 'Sylvain Perron'
    }
  ]
}

const installModules = Promise.method((...names) => {

  names.forEach(name => {
    if (!name || typeof(name) !== 'string') {
      throw new TypeError('Expected module name to be a string')
    }
  })

  const modulesCommand = names.join(' ')
  const install = spawn('npm', ['install', '--save', modulesCommand])

  // util.print(waitingText)

  return new Promise((resolve, reject) => {
    install.stdout.on('data', (data) => {
      process.stdout.write(data.toString())
    })

    install.stderr.on('data', (data) => {
      process.stderr.write(data.toString())
    })

    install.on('close', (code) => {
      if (code > 0) {
        reject()
        // util.print('error', "an error occured during module's installation")
      } else {
        resolve()
        // util.print('success', "module's installation has completed successfully")
      }
    })
  })
})

const uninstallModules = Promise.method((...names) => {

})

module.exports = () => {
  return {
    get: listAllModules,
    install: installModules,
    uninstall: uninstallModules
  }
}
