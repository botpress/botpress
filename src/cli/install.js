import util from '../util'

import createModules from '../modules'

import stats from '../stats'

const waitingText = 'please wait, we are trying to install your new modules...'

module.exports = function(module, modules) {
  stats({}).track('cli', 'modules', 'install')
  util.print('info', waitingText)
  let modulesManager = createModules(null, './', null)
  modulesManager.install(module, ...modules)
}
