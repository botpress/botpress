import * as consts from '../constants'
import { currentVersions } from '../utils/current-versions'
import { logger } from '../utils/logging'
import * as pkg from '../utils/package-json'
import { allPackages } from '../utils/pnpm-workspaces'

export const checkVersions = (targetVersions: Record<consts.TargetPackage, string> = currentVersions) => {
  for (const pkgPath of allPackages) {
    const { dependencies, devDependencies } = pkg.readPackage(pkgPath)

    for (const [name, version] of Object.entries(targetVersions)) {
      const currentDepVersion = dependencies[name]
      if (currentDepVersion && currentDepVersion !== version) {
        throw new Error(`Dependency ${name} is out of sync in ${pkgPath}: ${currentDepVersion} != ${version}`)
      }

      const currentDevDepVersion = devDependencies[name]
      if (currentDevDepVersion && currentDevDepVersion !== version) {
        throw new Error(`Dev dependency ${name} is out of sync in ${pkgPath}: ${currentDevDepVersion} != ${version}`)
      }
    }
  }

  logger.info('All versions are in sync')
}
