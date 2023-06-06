import { YargsConfig } from '@bpinternal/yargs-extra'
import * as prompts from 'prompts'
import * as semver from 'semver'
import * as config from '../config'
import { findReferences } from '../packages'
import { logger } from '../utils/logging'
import * as pkgjson from '../utils/package-json'
import { syncVersions } from './sync-versions'

type VersionJump = 'major' | 'minor' | 'patch' | 'none'

const promptJump = async (pkgName: string, pkgVersion: string): Promise<VersionJump> => {
  const { jump: promptedJump } = await prompts.prompt({
    type: 'select',
    name: 'jump',
    message: `Bump ${pkgName} version from ${pkgVersion}`,
    choices: [
      { title: 'None', value: 'none' },
      { title: 'Patch', value: 'patch' },
      { title: 'Minor', value: 'minor' },
      { title: 'Major', value: 'major' },
    ],
  })
  return promptedJump
}

export const bumpVersion = async (packageName: string, argv: YargsConfig<typeof config.bumpSchema>) => {
  const { dependency, dependents } = findReferences(argv.rootDir, packageName)
  const targetWorkspaces = [dependency, ...dependents]

  const currentVersions = targetWorkspaces.reduce(
    (acc, { content: { name, version } }) => ({ ...acc, [name]: version }),
    {} as Record<string, string>
  )
  const targetVersions = { ...currentVersions }

  for (const {
    path: pkgPath,
    content: { name: pkgName, version: pkgVersion },
  } of targetWorkspaces) {
    const jump = await promptJump(pkgName, pkgVersion)
    if (jump === 'none') {
      continue
    }

    const next = semver.inc(pkgVersion, jump)
    if (!next) {
      throw new Error(`Invalid version jump: ${jump}`)
    }

    targetVersions[pkgName] = next
    pkgjson.update(pkgPath, { version: next })
  }

  if (argv.sync) {
    logger.info('Syncing versions...')
    syncVersions(argv, { targetVersions })
  }
}
