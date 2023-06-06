import * as fs from 'fs'
import * as glob from 'glob'
import * as pathlib from 'path'
import * as yaml from 'yaml'
import * as objects from './utils/objects'
import * as pkgjson from './utils/package-json'

export type TargetPackage = '@botpress/client' | '@botpress/sdk' | '@botpress/cli'

export const PACKAGE_PATHS = {
  '@botpress/client': pathlib.join('packages', 'client'),
  '@botpress/sdk': pathlib.join('packages', 'sdk'),
  '@botpress/cli': pathlib.join('packages', 'cli'),
} satisfies Record<TargetPackage, string>

// this is a reverse dependency tree (i.e. the keys are the dependencies and the values are the dependents)
export const DEPENDENCY_TREE = {
  '@botpress/client': ['@botpress/sdk', '@botpress/cli'],
  '@botpress/sdk': ['@botpress/cli'],
  '@botpress/cli': [],
} satisfies Record<TargetPackage, TargetPackage[]>

const absolute = (rootDir: string) => (p: string) => pathlib.resolve(rootDir, p)

export const readVersions = (rootDir: string): Record<TargetPackage, string> => {
  const absPaths = objects.mapValues(PACKAGE_PATHS, absolute(rootDir))
  const packages = objects.mapValues(absPaths, pkgjson.readPackage)
  return objects.mapValues(packages, (p) => p.version)
}

export const findAllPackages = (rootDir: string): string[] => {
  const pnpmWorkspacesFile = pathlib.join(rootDir, 'pnpm-workspace.yaml')
  const pnpmWorkspacesContent = fs.readFileSync(pnpmWorkspacesFile, 'utf-8')
  const pnpmWorkspaces: string[] = yaml.parse(pnpmWorkspacesContent).packages
  const globMatches = pnpmWorkspaces.flatMap((ws) => glob.globSync(ws, { absolute: false, cwd: rootDir }))
  const actualPackages = globMatches.filter((ws) => pkgjson.isPackage(ws))
  return actualPackages.map(absolute(rootDir))
}
