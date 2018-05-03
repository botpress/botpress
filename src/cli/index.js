import program from 'commander'

import init from './init'
import start from './start'
import create from './create'
import install from './install'
import uninstall from './uninstall'
import migrate from './migrate'
import list from './list'

import { getBotpressVersion, collectArgs } from '../util'

program
  .command('init')
  .description('Create a new bot in current directory')
  .option('-y, --yes', 'Say yes to every prompt and use default values')
  .action(init)

const defaultWatchExt = '.js,.jsx,.json,.yml'
program
  .command('start [path]')
  .alias('s')
  .description('Starts running a bot')
  .option('-w, --watch', 'Watch bot for changes, and restart automatically')
  .option(
    '--watchExt <extensions>',
    `When watching, which file extensions to watch. Default: "${defaultWatchExt}"`,
    defaultWatchExt
  )
  .option(
    '--watchDir <dir>',
    `When watching, what to watch. Can be repeated. Default: Directory of botfile.js`,
    collectArgs,
    []
  )
  .option(
    '--watchIgnore <file|dir>',
    `When watching, what to ignore. Can be repeated. Default: dataDir, watchExt from botfile.js, and node_modules`,
    collectArgs,
    []
  )
  .action(start)

program
  .command('install <module> [modules...]')
  .alias('i')
  .description('Add modules to the current bot')
  .action(install)

program
  .command('uninstall <module> [modules...]')
  .alias('u')
  .description('Remove modules from the current bot')
  .action(uninstall)

program
  .command('list')
  .alias('ls')
  .description('List installed modules')
  .action(list)

program
  .command('create')
  .alias('c')
  .description('Create a new module for development or distribution')
  .action(create)

program
  .command('migrate <fromVersion>')
  .description('Migrates the current bot from version X')
  .action(migrate)

program
  .version(getBotpressVersion())
  .description('Easily create, manage and extend chatbots.')
  .parse(process.argv)

if (!program.args.length) {
  program.help()
}
