import { YargsConfig } from '@bpinternal/yargs-extra'
import * as config from '../config'
import { findAllPackages, readVersions } from '../packages'
import * as pkgjson from '../utils/package-json'

export type SyncVersionsOpts = {
  targetVersions: Record<string, string>
}

export const syncVersions = (argv: YargsConfig<typeof config.syncSchema>, opts: Partial<SyncVersionsOpts> = {}) => {
  const allPackages = findAllPackages(argv.rootDir)
  const targetVersions = opts.targetVersions || readVersions(argv.rootDir)

  for (const pkgPath of allPackages) {
    const { dependencies, devDependencies } = pkgjson.readPackage(pkgPath)

    for (const [name, version] of Object.entries(targetVersions)) {
      if (dependencies && dependencies[name]) {
        dependencies[name] = version
      }

      if (devDependencies && devDependencies[name]) {
        devDependencies[name] = version
      }
    }

    pkgjson.updatePackage(pkgPath, { dependencies, devDependencies })
  }
}
