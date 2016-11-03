import path from 'path'
import fs from 'fs'
import util from '../util'
import chalk from 'chalk'

module.exports = function(projectPath, options) {
  const skip = !!options.skip
  let skin = require(path.join(__dirname, '../skin'))
  projectPath = path.resolve(projectPath || '.')

  if(!skip) {
    try {
      skin = require(path.join(projectPath, 'node_modules', '@botskin/botskin'))
    }
    catch (err)
    {
      util.print('warn', 'The project does not have skin installed as a dependency.')
      util.print('Using this installation of skin instead.')
    }
  }

  const botfile = path.join(projectPath, 'botfile.js')
  if(!fs.existsSync(botfile)) {
    util.print('error', `(fatal) No ${chalk.bold('botfile.js')} file found at: ` + botfile)
    process.exit(1)
  }

  const bot = new skin({ botfile })
  bot.start()
}
