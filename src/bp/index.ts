import { EventEmitter } from 'events'

const yn = require('yn')
const path = require('path')
const fs = require('fs')
const metadataContent = require('../../metadata.json')
const getos = require('./common/getos')
const { Debug } = require('./debug')

const printPlainError = err => {
  console.log('Error starting botpress')
  console.log(err)
  console.log(err.message)
  console.log('---STACK---')
  console.log(err.stack)
}

global.DEBUG = Debug
global.printErrorDefault = printPlainError

const originalWrite = process.stdout.write

const shouldDiscardError = message =>
  !![
    '[DEP0005]' // Buffer() deprecation warning
  ].find(e => message.indexOf(e) >= 0)

function stripDeprecationWrite(buffer: string, encoding: string, cb?: Function | undefined): boolean
function stripDeprecationWrite(buffer: string | Buffer, cb?: Function | undefined): boolean
function stripDeprecationWrite(this: Function): boolean {
  if (typeof arguments[0] === 'string' && shouldDiscardError(arguments[0])) {
    return (arguments[2] || arguments[1])()
  }

  return originalWrite.apply(this, arguments)
}

process.BOTPRESS_EVENTS = new EventEmitter()
process.LOADED_MODULES = {}
process.PROJECT_LOCATION = process.pkg
  ? path.dirname(process.execPath) // We point at the binary path
  : __dirname // e.g. /dist/..

process.stderr.write = stripDeprecationWrite

process.on('unhandledRejection', err => {
  global.printErrorDefault(err)
})

process.on('uncaughtException', err => {
  global.printErrorDefault(err)
  process.exit(1)
})

try {
  require('dotenv').config({ path: path.resolve(process.PROJECT_LOCATION, '.env') })
  process.core_env = process.env

  const argv = require('yargs')
    .command(
      ['serve', '$0'],
      'Start your botpress server',
      {
        production: {
          alias: 'p',
          description: 'Whether you want to run in production mode or not',
          default: false,
          type: 'boolean'
        }
      },
      argv => {
        process.IS_PRODUCTION = argv.production || yn(process.env.BP_PRODUCTION)

        let defaultVerbosity = process.IS_PRODUCTION ? 0 : 2
        if (!isNaN(Number(process.env.VERBOSITY_LEVEL))) {
          defaultVerbosity = Number(process.env.VERBOSITY_LEVEL)
        }

        process.VERBOSITY_LEVEL = argv.verbose ? Number(argv.verbose) : defaultVerbosity
        process.IS_LICENSED = true
        process.ASSERT_LICENSED = () => {}
        process.BOTPRESS_VERSION = metadataContent.version

        process.IS_PRO_AVAILABLE = fs.existsSync(path.resolve(process.PROJECT_LOCATION, 'pro')) || process.pkg
        const configPath = path.join(process.PROJECT_LOCATION, '/data/global/botpress.config.json')

        if (process.IS_PRO_AVAILABLE) {
          process.CLUSTER_ENABLED = yn(process.env.CLUSTER_ENABLED)

          if (process.env.PRO_ENABLED === undefined) {
            if (fs.existsSync(configPath)) {
              const config = require(configPath)
              process.IS_PRO_ENABLED = config.pro && config.pro.enabled
            }
          } else {
            process.IS_PRO_ENABLED = yn(process.env.PRO_ENABLED)
          }
        }

        getos.default().then(distro => {
          process.distro = distro
          require('./bootstrap')
        })
      }
    )
    .command(
      'pull',
      'Sync pending changes from an external server running botpress to local files',
      {
        url: {
          description: 'url of the botpress server from which you want to pull changes',
          default: 'http://localhost:3000',
          type: 'string'
        },
        authToken: {
          alias: 'token',
          description: 'your authorization token on the remote botpress server',
          // tslint:disable-next-line:no-null-keyword
          default: null,
          type: 'string'
        },
        targetDir: {
          alias: 'dir',
          description: 'target directory in which you want sync the changes. will be created if doesnt exist',
          default: path.join(__dirname, 'data'),
          type: 'string'
        }
      },
      argv => require('./pull').default(argv)
    )
    .command(
      'bench',
      'Run a benchmark on your bot',
      {
        url: {
          default: 'http://localhost:3000'
        },
        botId: {
          description: 'The name of the bot to run the benchmark on',
          default: 'welcome-bot'
        },
        users: {
          alias: 'u',
          description: 'The number of users sending a message at the same time',
          default: 10
        },
        messages: {
          alias: 'm',
          description: 'The number of messages that each users will send',
          default: 5
        },
        slaLimit: {
          alias: 'limit',
          description: 'Message response delay must be below this threshold (ms)',
          default: 1500
        },
        slaTarget: {
          alias: 'target',
          description: 'Minimum percentage of respected SLA required to continue incrementing users',
          default: 100
        },
        increments: {
          alias: 'i',
          description: 'If set, the test will increment users by this value until the SLA is breached',
          default: 0
        },
        text: {
          description: 'Configure the text message that will be send by the fake users',
          default: 'Hey'
        }
      },
      argv => {
        require('./bench').default(argv)
      }
    )
    .command('extract', 'Extract module archive files (.tgz) in their respective folders', {}, argv => {
      getos.default().then(distro => {
        process.distro = distro
        require('./extractor').default(argv)
      })
    })
    .option('verbose', {
      alias: 'v',
      description: 'verbosity level'
    })
    .count('verbose')
    .help().argv
} catch (err) {
  global.printErrorDefault(err)
}
