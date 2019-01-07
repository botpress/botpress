const yn = require('yn')
const pa = require('path')
const fs = require('fs')
const metadataContent = require('../../metadata.json')

const printPlainError = err => {
  console.log('Error starting botpress')
  console.log(err)
  console.log(err.message)
  console.log('---STACK---')
  console.log(err.stack)
}

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

process.LOADED_MODULES = {}
process.PROJECT_LOCATION = process.pkg
  ? pa.dirname(process.execPath) // We point at the binary path
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
  const argv = require('yargs')
    .command('bench', 'Run a benchmark on your bot', {
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
      }
    })
    .option('verbose', {
      alias: 'v',
      description: 'verbosity level'
    })
    .option('production', {
      alias: 'p',
      default: false,
      description: 'run in production mode'
    })
    .boolean('production')
    .count('verbose')
    .help().argv

  process.IS_PRODUCTION = argv.production || yn(process.env.BP_PRODUCTION)

  let defaultVerbosity = process.IS_PRODUCTION ? 0 : 2
  if (!isNaN(Number(process.env.VERBOSITY_LEVEL))) {
    defaultVerbosity = Number(process.env.VERBOSITY_LEVEL)
  }

  process.VERBOSITY_LEVEL = argv.verbose ? Number(argv.verbose) : defaultVerbosity
  process.IS_LICENSED = true
  process.ASSERT_LICENSED = () => {}
  process.BOTPRESS_VERSION = metadataContent.version

  const isProBuild = fs.existsSync(pa.resolve(process.PROJECT_LOCATION, 'pro')) || process.pkg
  const configPath = pa.join(process.PROJECT_LOCATION, '/data/global/botpress.config.json')

  if (isProBuild && fs.existsSync(configPath)) {
    const config = require(configPath)
    process.IS_PRO_ENABLED = config.pro && config.pro.enabled
  }

  if (argv._.includes('bench')) {
    const Bench = require('./bench').default
    const benchmark = new Bench(argv)
    benchmark.start()
  } else {
    require('./bootstrap')
  }
} catch (err) {
  global.printErrorDefault(err)
}
