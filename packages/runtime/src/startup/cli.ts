import yargs from 'yargs'
import yn from 'yn'
import getos from '../common/getos'

let defaultVerbosity = process.IS_PRODUCTION ? 0 : 2
if (!isNaN(Number(process.env.VERBOSITY_LEVEL))) {
  defaultVerbosity = Number(process.env.VERBOSITY_LEVEL)
}

yargs
  .command(
    ['serve', '$0'],
    'Start the botpress runtime',
    {
      production: {
        alias: 'p',
        description: 'Whether you want to run in production mode or not',
        default: false,
        type: 'boolean'
      },
      autoMigrate: {
        description:
          'When this flag is set, Botpress will automatically migrate your content and configuration files when upgrading',
        default: false,
        type: 'boolean'
      }
    },
    async argv => {
      process.IS_PRODUCTION = argv.production || yn(process.env.BP_PRODUCTION) || yn(process.env.CLUSTER_ENABLED)

      process.AUTO_MIGRATE =
        process.env.AUTO_MIGRATE === undefined ? yn(argv.autoMigrate) : yn(process.env.AUTO_MIGRATE)

      process.TELEMETRY_URL = process.env.TELEMETRY_URL || 'https://telemetry.botpress.cloud/ingest'
      process.VERBOSITY_LEVEL = argv.verbose ? Number(argv.verbose) : defaultVerbosity
      process.distro = await getos()

      const { start } = require('../runtime/app/bootstrap')

      await start()
    }
  )
  .help().argv
