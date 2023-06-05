import yargs from '@bpinternal/yargs-extra'
import { bumpVersion } from './commands/bump-versions'
import { syncVersions } from './commands/sync-versions'

yargs
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
          default: false,
        }),
    (argv) => {
      void bumpVersion(`@botpress/${argv.package}`)
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
  .strict()
  .demandCommand(1)
  .parse()
