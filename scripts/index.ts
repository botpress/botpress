import yargs from '@bpinternal/yargs-extra'
import { bumpVersion } from './commands/bump-versions'
import { checkVersions } from './commands/check-versions'
import { syncVersions } from './commands/sync-versions'
import { logger } from './utils/logging'

const onError = (thrown: unknown): never => {
  const err = thrown instanceof Error ? thrown : new Error(`${thrown}`)
  logger.error(err.message)
  process.exit(1)
}

const yargsFail = (msg: string, err: Error) => {
  err ? onError(err) : onError(msg)
}

process.on('unhandledRejection', onError)
process.on('uncaughtException', onError)

void yargs
  .command(
    'bump <package>',
    'Bump version of a package',
    () =>
      yargs
        .positional('package', {
          choices: ['client', 'sdk', 'cli'] as const,
          demandOption: true,
        })
        .option('sync', {
          type: 'boolean',
          default: true,
        }),
    (argv) => {
      void bumpVersion(`@botpress/${argv.package}`, argv)
    }
  )
  .command(
    'sync',
    'Sync versions of all packages',
    () => yargs,
    () => {
      void syncVersions()
    }
  )
  .command(
    'check',
    'Check if all packages have the target version',
    () => yargs,
    () => {
      void checkVersions()
    }
  )
  .strict()
  .help()
  .fail(yargsFail)
  .demandCommand(1)
  .parse()
