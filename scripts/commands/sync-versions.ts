import * as fs from 'fs'
import * as glob from 'glob'
import * as pathlib from 'path'
import * as yaml from 'yaml'
import * as consts from '../constants'
import * as pkg from '../utils/package-json'

export const currentVersions = {
  '@botpress/client': pkg.readPackage(consts.PACKAGE_PATHS['@botpress/client']).version,
  '@botpress/sdk': pkg.readPackage(consts.PACKAGE_PATHS['@botpress/sdk']).version,
  '@botpress/cli': pkg.readPackage(consts.PACKAGE_PATHS['@botpress/cli']).version,
} satisfies Record<TargetPackage, string>

export type TargetPackage = '@botpress/client' | '@botpress/sdk' | '@botpress/cli'
export const syncVersions = (targetVersions: Record<TargetPackage, string> = currentVersions) => {
  const pnpmWorkspacesFile = pathlib.join(consts.ROOT_DIR, 'pnpm-workspace.yaml')
  const pnpmWorkspacesContent = fs.readFileSync(pnpmWorkspacesFile, 'utf-8')
  const pnpmWorkspaces: string[] = yaml.parse(pnpmWorkspacesContent).packages

  const globMatches = pnpmWorkspaces.flatMap((ws) => glob.globSync(ws, { absolute: false, cwd: consts.ROOT_DIR }))
  const allPackages = globMatches.filter((ws) => pkg.isPackage(ws))

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
