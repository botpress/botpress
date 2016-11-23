import { print } from '../util'
import ModulesManager from '../module'

module.exports = function() {
  let modulesManager = ModulesManager()
  let modules = modulesManager.getInstalled()

  if (!modules || modules.length === 0) {
    print('info', "There are no module installed.")
    print('------------------')
    print('info', "To install modules, use `botpress install <module-name>`")
    print('info', "You can discover modules in the Modules section of your bot UI" +
      ". You can also search npm with the botpress keyword.")
  } else {
    print('info', "There are " + modules.length + " modules installed:")
    modules.forEach(mod => print('>> ' + mod))
  }
}
