import path from 'path'
import Promise from 'bluebird'

import  { isDeveloping } from './util'

const getListOfAllModules = () => {
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
      icon: 'open',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      downloads: 3000,
      installed: true,
      license: 'AGPL-3',
      author: 'Sylvain Perron'
    }
  ]
}

const installModule = (name) => {

}

const uninstallModule = (name) => {

}

module.exports = () => {
  return {
    get: getListOfAllModules,
    install: installModule,
    uninstall: uninstallModule
  }
}
