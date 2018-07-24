import os from 'os'
import path from 'path'
import fs from 'fs'
import util from '../util'
import chalk from 'chalk'
import nodemon from 'nodemon'
import { monitorCtrlC } from 'monitorctrlc'
import { execSync } from 'child_process'

const getPath = path => {
  if (os.platform() === 'win32') {
    const shortPath = execSync(`@echo off && for %I in ("${path}") do echo %~sI`)
    return shortPath.toString('utf8').replace(/(\n|\r)+$/, '')
  } else {
    return path
  }
}

/**
 * Entry point of botpress
 *
 * It will do the following things:
 *
 * 1. Find botpress instance creator in `node_modules` folder in current project.
 * 2. Find the `botfile.js` which will be injected into the creator to create the instance.
 * 3. Start the botpress instance.
 */
module.exports = (projectPath, options) => {
  let Botpress = null

  if (!projectPath || typeof projectPath !== 'string') {
    projectPath = '.'
  }

  projectPath = path.resolve(projectPath)

  try {
    const botpress = require(path.resolve(__dirname, '..'))
    Botpress = botpress.Botpress
  } catch (err) {
    util.print('error', err.message)
    util.print('error', err.stack)
    util.print('error', '(fatal) Could not load the local version of botpress')
    util.print('Hint: 1) have you used `botpress init` to create a new bot the proper way?')
    util.print('Hint: 2) Do you have read and write permissions on the current directory?')
    util.print('-------------')
    util.print(
      'If none of the above works, this might be a bug in botpress. ' +
        'Please contact the Botpress Team on gitter and provide the printed error above.'
    )
    process.exit(1)
  }

  const botfilePath = path.join(projectPath, 'botfile.js')
  if (!fs.existsSync(botfilePath)) {
    util.print('error', `(fatal) No ${chalk.bold('botfile.js')} file found at: ${botfilePath}`)
    process.exit(1)
  }

  const botfile = require(botfilePath)

  const getDefaultWatchIgnore = () => {
    const dataDir = util.getDataLocation(botfile.dataDir, projectPath)
    return [dataDir, 'node_modules']
  }

  const opts = options.opts()
  if (opts.watch || opts.w) {
    util.print('info', '*** watching files for changes ***')

    const argvWithoutWatch = process.argv.filter(arg => !/^(--watch|-w)$/.test(arg))
    argvWithoutWatch[0] = getPath(argvWithoutWatch[0])

    const nodemonOptions = {
      cwd: process.cwd(),
      exec: argvWithoutWatch.join(' '),
      ext: opts.watchExt,
      watch: opts.watchDir && opts.watchDir.length ? opts.watchDir : undefined,
      ignore: opts.watchIgnore && opts.watchIgnore.length ? opts.watchIgnore : getDefaultWatchIgnore(),
      stdin: false,
      restartable: false
    }

    const mon = nodemon(nodemonOptions)
    mon.on('restart', (changedFile, two) =>
      util.print('info', '*** restarting botpress because of file change: ', changedFile)
    )

    monitorCtrlC(() => {
      mon.emit('quit')
      setTimeout(() => process.exit(), 100)
    })
  } else {
    const bot = new Botpress({ botfile, options })
    bot.start()
  }
}
