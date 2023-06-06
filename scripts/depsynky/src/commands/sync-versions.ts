import { YargsConfig } from '@bpinternal/yargs-extra'
import * as config from '../config'
import * as utils from '../utils'
import { searchWorkspaces } from '../utils/pnpm'

export type SyncVersionsOpts = {
  targetVersions: Record<string, string>
}

export const syncVersions = (argv: YargsConfig<typeof config.syncSchema>, opts: Partial<SyncVersionsOpts> = {}) => {
  const allPackages = searchWorkspaces(argv.rootDir)
  const targetVersions = opts.targetVersions ?? utils.pnpm.versions(allPackages)

  for (const { path: pkgPath } of allPackages) {
    const { dependencies, devDependencies } = utils.pkgjson.read(pkgPath)

    for (const [name, version] of utils.objects.entries(targetVersions)) {
      if (dependencies && dependencies[name]) {
        dependencies[name] = version
      }

      if (devDependencies && devDependencies[name]) {
        devDependencies[name] = version
      }
    }

    utils.pkgjson.update(pkgPath, { dependencies, devDependencies })
  }
}
