import { YargsConfig } from '@bpinternal/yargs-extra'
import * as prompts from 'prompts'
import * as semver from 'semver'
import * as config from '../config'
import { DEPENDENCY_TREE, PACKAGE_PATHS, TargetPackage, readVersions } from '../packages'
import { logger } from '../utils/logging'
import * as pkgjson from '../utils/package-json'
import { syncVersions } from './sync-versions'

type VersionJump = 'major' | 'minor' | 'patch'

const promptJump = async (pkgName: string, pkgVersion: string): Promise<VersionJump> => {
  const { jump: promptedJump } = await prompts.prompt({
    type: 'select',
    name: 'jump',
    message: `Bump ${pkgName} version from ${pkgVersion}`,
    choices: [
      { title: 'Patch', value: 'patch' },
      { title: 'Minor', value: 'minor' },
      { title: 'Major', value: 'major' },
    ],
  })
  return promptedJump
}

export const bumpVersion = async (targetPackage: TargetPackage, argv: YargsConfig<typeof config.bumpSchema>) => {
  const dependencies = DEPENDENCY_TREE[targetPackage]
  const targetPackages = [targetPackage, ...dependencies]

  const currentVersions = readVersions(argv.rootDir)

  const targetVersions = { ...currentVersions } satisfies Record<TargetPackage, string>
  for (const pkgName of targetPackages) {
    const pkgVersion = currentVersions[pkgName]
    const jump = await promptJump(pkgName, pkgVersion)
    const current = currentVersions[pkgName]
    const next = semver.inc(current, jump)
    if (!next) {
      throw new Error(`Invalid version jump: ${jump} from ${current}`)
    }

    targetVersions[pkgName] = next
    pkgjson.updatePackage(PACKAGE_PATHS[pkgName], { version: next })
  }

  if (argv.sync) {
    logger.info('Syncing versions...')
    syncVersions(argv, { targetVersions })
  }
}
