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
  let botpress = null
  projectPath = path.resolve(projectPath || '.')

  try {
    botpress = require(path.join(projectPath, 'node_modules', 'botpress'))
  } catch (err) {
    util.print('error', '(fatal) The project does not have botpress installed as a dependency')
    util.print('You need to `npm install botpress --save` in the bot\'s project')
    util.print('Please refer to `botpress init` to create a new bot the proper way')
    process.exit(1)
  }

  const botfile = path.join(projectPath, 'botfile.js')
  if (!fs.existsSync(botfile)) {
    util.print('error', `(fatal) No ${chalk.bold('botfile.js')} file found at: ` + botfile)
    process.exit(1)
  }

  const bot = new botpress({ botfile })
  bot.start()
}
