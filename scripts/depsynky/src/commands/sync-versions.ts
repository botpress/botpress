import { YargsConfig } from '@bpinternal/yargs-extra'
import * as config from '../config'
import { searchWorkspaces } from '../packages'
import * as pkgjson from '../utils/package-json'

export type SyncVersionsOpts = {
  targetVersions: Record<string, string>
}

export const syncVersions = (argv: YargsConfig<typeof config.syncSchema>, opts: Partial<SyncVersionsOpts> = {}) => {
  const allPackages = searchWorkspaces(argv.rootDir)
  const targetVersions =
    opts.targetVersions ||
    allPackages.reduce(
      (acc, { content: { name, version } }) => ({ ...acc, [name]: version }),
      {} as Record<string, string>
    )

  for (const { path: pkgPath } of allPackages) {
    const { dependencies, devDependencies } = pkgjson.read(pkgPath)

    for (const [name, version] of Object.entries(targetVersions)) {
      if (dependencies && dependencies[name]) {
        dependencies[name] = version
      }

      if (devDependencies && devDependencies[name]) {
        devDependencies[name] = version
      }
    }

    pkgjson.update(pkgPath, { dependencies, devDependencies })
  }
}
