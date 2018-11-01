const yn = require('yn')
const pa = require('path')
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
  let defaultVerbosity = process.pkg ? 0 : 2
  if (!isNaN(Number(process.env.VERBOSITY_LEVEL))) {
    defaultVerbosity = Number(process.env.VERBOSITY_LEVEL)
  }

  const argv = require('yargs')
    .option('verbose', {
      alias: 'v',
      default: defaultVerbosity,
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

  process.VERBOSITY_LEVEL = Number(argv.verbose)
  process.IS_PRODUCTION = argv.production || yn(process.env.BP_PRODUCTION)
  process.IS_LICENSED = true
  process.ASSERT_LICENSED = () => {}
  process.BOTPRESS_VERSION = metadataContent.version
  process.BOTPRESS_EDITION = metadataContent.edition

  require('./bootstrap')
} catch (err) {
  global.printErrorDefault(err)
}
