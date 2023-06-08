import { YargsConfig } from '@bpinternal/yargs-extra'
import * as config from '../config'
import * as utils from '../utils'
import { searchWorkspaces } from '../utils/pnpm'

export type SyncVersionsOpts = {
  targetVersions: Record<string, string>
}

const LOCAL_VERSION = 'workspace:*'
const updater =
  (pkg: utils.pkgjson.PackageJson) => (current: Record<string, string>, target: Record<string, string>) => {
    for (const [name, version] of utils.objects.entries(target)) {
      const currentVersion = current[name]
      if (!currentVersion) {
        continue
      }
      const isLocal = currentVersion === LOCAL_VERSION
      const isPublic = !pkg.private
      if (!isLocal) {
        current[name] = version
        continue
      }
      if (isPublic && isLocal) {
        utils.logging.logger.warn(
          `Package ${pkg.name} is public and cannot depend on local package ${name}. To keep reference on local package, make ${pkg.name} private.`
        )
        current[name] = version
        continue
      }
    }
    return current
  }

export const syncVersions = (argv: YargsConfig<typeof config.syncSchema>, opts: Partial<SyncVersionsOpts> = {}) => {
  const allPackages = searchWorkspaces(argv.rootDir)
  const targetVersions = opts.targetVersions ?? utils.pnpm.versions(allPackages)

  for (const { path: pkgPath, content } of allPackages) {
    const { dependencies, devDependencies } = utils.pkgjson.read(pkgPath)

    const update = updater(content)
    const updatedDeps = dependencies && update(dependencies, targetVersions)
    const updatedDevDeps = devDependencies && update(devDependencies, targetVersions)

    utils.pkgjson.update(pkgPath, { dependencies: updatedDeps, devDependencies: updatedDevDeps })
  }
}
