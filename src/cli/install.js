import { spawn } from 'child_process'
import util from '../util'

import ModulesManager from '../manager'

const waitingText = 'please wait, we are trying to install your new module...'

module.exports = function(...args) {
  let commander = args.pop() // Remove the Commander

  let manager = ModulesManager()
  manager.install(...args)

  // util.print('error', 'module name or path is not valid')

}
