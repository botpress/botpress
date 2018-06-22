import program from 'commander'

import init from './init'
import start from './start'
import create from './create'
import update from './update'
import migrate from './migrate'
import list from './list'
import { login, logout } from './auth'
import ghostSync from './ghost-sync'
import cloudPair from './cloudPair'

import { getBotpressVersion, collectArgs } from '../util'

program
  .command('init [dirName]')
  .description('Create a new bot in new directory (or in current directory if not provided)')
  .option('-y, --yes', 'Say yes to every prompt and use default values')
  .action(init)

const defaultWatchExt = '.js,.jsx,.json,.yml'
const defaultBotpressCloudEndpoint = 'https://botpress.cloud'

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
  .option('-i, --inspect', 'Inspect bot with "debugger"')
  .action(start)

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
  .command('update [version]')
  .alias('up')
  .description('Updates your bot and all the modules to a specific version')
  .action(update)

program
  .command('migrate <fromVersion>')
  .description('Migrates the current bot from version X')
  .action(migrate)

program
  .command('login <bot-server-url>')
  .description(
    'Login to the given bot instance. Provide the full base URL for the bot, like https://mybot.herokuapp.com.'
  )
  .action(login)

program
  .command('logout [bot-server-url]')
  .description(
    'Forget saved auth for the given bot instance, or all recorded auth tokens (if bot URL is not specified)'
  )
  .action(logout)

program
  .command('ghost-sync <bot-server-url>')
  .description('Pull the ghost content from the remote bot instance and apply it locally.')
  .action(ghostSync)

program
  .command('cloud-pair <api-token>')
  .description('Pairs your local bot with the Botpress Cloud (supercharges your bot)')
  .option(
    '--endpoint <endpoint-url>',
    `Change the Botpress Cloud server endpoint. Default: "${defaultBotpressCloudEndpoint}"`,
    defaultBotpressCloudEndpoint
  )
  .action(cloudPair)

program
  .version(getBotpressVersion())
  .description('Easily create, manage and extend chatbots.')
  .parse(process.argv)

if (!program.args.length) {
  program.help()
}
