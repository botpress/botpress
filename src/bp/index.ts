const printPlainError = err => {
  console.log('Error starting botpress')
  console.log(err)
  console.log(err.message)
  console.log('---STACK---')
  console.log(err.stack)
}

global.printErrorDefault = printPlainError

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
    .count('verbose')
    .help().argv

  process.VERBOSITY_LEVEL = Number(argv.verbose)

  require('./bootstrap')
} catch (err) {
  global.printErrorDefault(err)
}
