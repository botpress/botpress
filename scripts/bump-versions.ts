import yargs from '@bpinternal/yargs-extra'
import * as prompts from 'prompts'
import * as semver from 'semver'
import * as pkg from './package-json'
import { currentVersions, dependencyTree, packagePaths } from './packages'
import { TargetPackage, syncVersions } from './sync-versions'

type VersionJump = 'major' | 'minor' | 'patch'

const promptJump = async (pkgName: TargetPackage): Promise<VersionJump> => {
  const current = currentVersions[pkgName]
  const { jump: promptedJump } = await prompts.prompt({
    type: 'select',
    name: 'jump',
    message: `Bump ${pkgName} version from ${current}`,
    choices: [
      { title: 'Patch', value: 'patch' },
      { title: 'Minor', value: 'minor' },
      { title: 'Major', value: 'major' },
    ],
  })
  return promptedJump
}

const bumpVersion = async (targetPackage: TargetPackage, opt: { sync?: boolean } = {}) => {
  const dependencies = dependencyTree[targetPackage]
  const targetPackages = [targetPackage, ...dependencies]

  const targetVersions = { ...currentVersions } satisfies Record<TargetPackage, string>
  for (const pkgName of targetPackages) {
    const jump = await promptJump(pkgName)
    const current = currentVersions[pkgName]
    const next = semver.inc(current, jump)
    if (!next) {
      throw new Error(`Invalid version jump: ${jump} from ${current}`)
    }

    targetVersions[pkgName] = next
    pkg.updatePackage(packagePaths[pkgName], { version: next })
  }

  if (opt.sync) {
    syncVersions(targetVersions)
  }
}

yargs
  .command(
    '$0 <package>',
    'Bump versions',
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
      void bumpVersion(`@botpress/${argv.package}`)
    }
  )
  .parse()
