import { YargsConfig } from '@bpinternal/yargs-extra'
import * as config from '../config'
import * as utils from '../utils'
import { searchWorkspaces } from '../utils/pnpm'

export type SyncVersionsOpts = {
  targetVersions: Record<string, string>
}

const LOCAL_VERSION = 'workspace:*'
const update = (current: Record<string, string>, target: Record<string, string>) => {
  for (const [name, version] of utils.objects.entries(target)) {
    const currentVersion = current[name]
    if (currentVersion && currentVersion !== LOCAL_VERSION) {
      current[name] = version
    }
  }
  return current
}

export const syncVersions = (argv: YargsConfig<typeof config.syncSchema>, opts: Partial<SyncVersionsOpts> = {}) => {
  const allPackages = searchWorkspaces(argv.rootDir)
  const targetVersions = opts.targetVersions ?? utils.pnpm.versions(allPackages)

  for (const { path: pkgPath } of allPackages) {
    const { dependencies, devDependencies } = utils.pkgjson.read(pkgPath)

    const updatedDeps = dependencies && update(dependencies, targetVersions)
    const updatedDevDeps = devDependencies && update(devDependencies, targetVersions)

    utils.pkgjson.update(pkgPath, { dependencies: updatedDeps, devDependencies: updatedDevDeps })
  }
}
