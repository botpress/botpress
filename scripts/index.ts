import yargs from '@bpinternal/yargs-extra'
import { bumpVersion } from './commands/bump-versions'
import { syncVersions } from './commands/sync-versions'
import { logger } from './utils/logging'

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
      logger.warn('Not implemented yet')
    }
  )
  .strict()
  .demandCommand(1)
  .parse()
