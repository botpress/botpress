import path from 'path'
import fs from 'fs'
import util from '../util'
import chalk from 'chalk'

/**
 * Entry point of botpress
 *
 * It will do the following things:
 *
 * 1. Find botpress instance creator in `node_modules` folder in current project.
 * 2. Find the `botfile.js` which will be injected into the creator to create the instance.
 * 3. Start the botpress instance.
 */
module.exports = function(projectPath, options) {
  let Botpress = null

  if (!projectPath || typeof(projectPath) !== 'string') {
    projectPath = '.'
  }

  projectPath = path.resolve(projectPath)

  try {
    Botpress = require(path.join(projectPath, 'node_modules', 'botpress')).Botpress
  } catch (err) {
    util.print('error', err.message)
    util.print('error', err.stack)
    util.print('error', '(fatal) Could not load the local version of botpress')
    util.print('Hint: 1) have you used `botpress init` to create a new bot the proper way?')
    util.print('Hint: 2) Do you have read and write permissions on the current directory?')
    util.print('-------------')
    util.print('If none of the above works, this might be a bug in botpress. ' +
      'Please contact the Botpress Team on gitter and provide the printed error above.')
    process.exit(1)
  }

  const botfile = path.join(projectPath, 'botfile.js')
  if (!fs.existsSync(botfile)) {
    util.print('error', `(fatal) No ${chalk.bold('botfile.js')} file found at: ` + botfile)
    process.exit(1)
  }

  const bot = new Botpress({ botfile })
  bot.start()
}
