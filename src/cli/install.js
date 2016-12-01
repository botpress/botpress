import util from '../util'

import createModules from '../modules'

const waitingText = 'please wait, we are trying to install your new modules...'

module.exports = function(module, modules) {
  util.print('info', waitingText)
  let modulesManager = createModules(null, './', null)
  modulesManager.install(module, ...modules)
}
