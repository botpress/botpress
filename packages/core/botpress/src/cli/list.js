import { print } from '../util'

import createModules from '../modules'

module.exports = () => {
  const modulesManager = createModules(null, './', null)
  const modules = modulesManager.listInstalled()

  if (!modules || modules.length === 0) {
    print('info', 'There are no module installed.')
    print('------------------')
    print('info', 'To install modules, use `npm install --save <module-name>`')
    print(
      'info',
      'You can discover modules in the Modules section of your bot UI' +
        '. You can also search npm with the botpress keyword.'
    )
  } else {
    print('info', 'There are ' + modules.length + ' modules installed:')
    modules.forEach(mod => print('>> ' + mod))
  }
}
