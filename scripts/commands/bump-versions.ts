import * as prompts from 'prompts'
import * as semver from 'semver'
import * as consts from '../constants'
import { currentVersions } from '../utils/current-versions'
import { logger } from '../utils/logging'
import * as pkg from '../utils/package-json'
import { syncVersions } from './sync-versions'

type VersionJump = 'major' | 'minor' | 'patch'

const promptJump = async (pkgName: consts.TargetPackage): Promise<VersionJump> => {
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

export const bumpVersion = async (targetPackage: consts.TargetPackage, opt: { sync: boolean }) => {
  const dependencies = consts.DEPENDENCY_TREE[targetPackage]
  const targetPackages = [targetPackage, ...dependencies]

  const targetVersions = { ...currentVersions } satisfies Record<consts.TargetPackage, string>
  for (const pkgName of targetPackages) {
    const jump = await promptJump(pkgName)
    const current = currentVersions[pkgName]
    const next = semver.inc(current, jump)
    if (!next) {
      throw new Error(`Invalid version jump: ${jump} from ${current}`)
    }

    targetVersions[pkgName] = next
    pkg.updatePackage(consts.PACKAGE_PATHS[pkgName], { version: next })
  }

  if (opt.sync) {
    logger.info('Syncing versions...')
    syncVersions(targetVersions)
  }
}
