import util from '../util'

import ModulesManager from '../module'

const waitingText = 'please wait, we are trying to uninstall the modules...'

module.exports = function(module, modules) {
  util.print('info', waitingText)
  let modulesManager = ModulesManager()
  modulesManager.uninstall(module, ...modules)
}
