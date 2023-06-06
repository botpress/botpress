import * as consts from '../constants'
import { currentVersions } from '../utils/current-versions'
import * as pkg from '../utils/package-json'
import { allPackages } from '../utils/pnpm-workspaces'

export const syncVersions = (targetVersions: Record<consts.TargetPackage, string> = currentVersions) => {
  for (const pkgPath of allPackages) {
    const { dependencies, devDependencies } = pkg.readPackage(pkgPath)

    for (const [name, version] of Object.entries(targetVersions)) {
      if (dependencies[name]) {
        dependencies[name] = version
      }

      if (devDependencies[name]) {
        devDependencies[name] = version
      }
    }

    pkg.updatePackage(pkgPath, { dependencies, devDependencies })
  }
}
