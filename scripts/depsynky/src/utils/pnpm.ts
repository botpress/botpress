import * as fs from 'fs'
import * as glob from 'glob'
import * as pathlib from 'path'
import * as yaml from 'yaml'
import * as errors from '../errors'
import * as objects from './objects'
import * as pkgjson from './pkgjson'

const abs = (rootDir: string) => (p: string) => pathlib.resolve(rootDir, p)

export type PnpmWorkspace = {
  path: string
  content: pkgjson.PackageJson
}

const PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml'

export const searchWorkspaces = (rootDir: string): PnpmWorkspace[] => {
  const pnpmWorkspacesFile = pathlib.join(rootDir, PNPM_WORKSPACE_FILE)
  if (!fs.existsSync(pnpmWorkspacesFile)) {
    throw new errors.DepSynkyError(`Could not find ${PNPM_WORKSPACE_FILE} at "${rootDir}"`)
  }
  const pnpmWorkspacesContent = fs.readFileSync(pnpmWorkspacesFile, 'utf-8')
  const pnpmWorkspaces: string[] = yaml.parse(pnpmWorkspacesContent).packages
  const globMatches = pnpmWorkspaces.flatMap((ws) => glob.globSync(ws, { absolute: false, cwd: rootDir }))
  const absGlobMatches = globMatches.map(abs(rootDir))
  const packageJsonPaths = absGlobMatches.map((p) => pathlib.join(p, 'package.json'))
  const actualPackages = packageJsonPaths.filter(fs.existsSync)
  const absolutePaths = actualPackages.map(abs(rootDir))
  return absolutePaths.map((p) => ({ path: p, content: pkgjson.read(p) }))
}

export const findReferences = (rootDir: string, pkgName: string) => {
  const workspaces = searchWorkspaces(rootDir)
  const dependency = workspaces.find((w) => w.content.name === pkgName)
  if (!dependency) {
    throw new errors.DepSynkyError(`Could not find package "${pkgName}"`)
  }
  const dependents = workspaces.filter((w) => w.content.dependencies?.[pkgName] || w.content.devDependencies?.[pkgName])
  return { dependency, dependents }
}

export const versions = (workspaces: PnpmWorkspace[]): Record<string, string> => {
  return objects.fromEntries(workspaces.map(({ content: { name, version } }) => [name, version]))
}

export const listPublicPackages = (rootDir: string): string[] => {
  const workspaces = searchWorkspaces(rootDir)
  return workspaces.filter((w) => !w.content.private).map((w) => w.content.name)
}
