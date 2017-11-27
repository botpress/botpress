import util from '../util'

import createModules from '../modules'

import stats from '../stats'

const waitingText = 'please wait, we are trying to install your new modules...'

module.exports = (module, modules) => {
  stats({}).track('cli', 'modules', 'install')
  util.print('info', waitingText)
  const modulesManager = createModules(null, './', null)
  modulesManager.install(module, ...modules)
}
