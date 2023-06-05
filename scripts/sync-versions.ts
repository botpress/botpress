import * as fs from 'fs'
import * as glob from 'glob'
import * as pathlib from 'path'
import * as yaml from 'yaml'
import { ROOT_DIR } from './constants'
import * as pkg from './package-json'
import { currentVersions } from './packages'

export type TargetPackage = '@botpress/client' | '@botpress/sdk' | '@botpress/cli'
export const syncVersions = (targetVersions: Record<TargetPackage, string>) => {
  const pnpmWorkspacesFile = pathlib.join(ROOT_DIR, 'pnpm-workspace.yaml')
  const pnpmWorkspacesContent = fs.readFileSync(pnpmWorkspacesFile, 'utf-8')
  const pnpmWorkspaces: string[] = yaml.parse(pnpmWorkspacesContent).packages

  const globMatches = pnpmWorkspaces.flatMap((ws) => glob.globSync(ws, { absolute: false, cwd: ROOT_DIR }))
  const allPackages = globMatches.filter((ws) => pkg.isPackage(ws))

  for (const pkgPath of allPackages) {
    const { dependencies, devDependencies, ...otherFields } = pkg.readPackage(pkgPath)

    for (const [name, version] of Object.entries(targetVersions)) {
      if (dependencies[name]) {
        dependencies[name] = version
      }

      if (devDependencies[name]) {
        devDependencies[name] = version
      }
    }

    pkg.writePackage(pkgPath, { dependencies, devDependencies, ...otherFields })
  }
}

syncVersions(currentVersions)
