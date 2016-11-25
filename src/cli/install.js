import util from '../util'

import ModulesManager from '../module'

const waitingText = 'please wait, we are trying to install your new modules...'

module.exports = function(module, modules) {
  util.print('info', waitingText)
  let modulesManager = ModulesManager()
  modulesManager.install(module, ...modules)
}
