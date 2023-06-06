import * as fs from 'fs'
import * as glob from 'glob'
import * as pathlib from 'path'
import * as yaml from 'yaml'
import * as pkgjson from './utils/package-json'

const absolute = (rootDir: string) => (p: string) => pathlib.resolve(rootDir, p)

export type Workspace = {
  path: string
  content: pkgjson.PackageJson
}

export const searchWorkspaces = (rootDir: string): Workspace[] => {
  const pnpmWorkspacesFile = pathlib.join(rootDir, 'pnpm-workspace.yaml')
  if (!fs.existsSync(pnpmWorkspacesFile)) {
    throw new Error(`Could not find pnpm-workspace.yaml at "${rootDir}"`)
  }

  const pnpmWorkspacesContent = fs.readFileSync(pnpmWorkspacesFile, 'utf-8')
  const pnpmWorkspaces: string[] = yaml.parse(pnpmWorkspacesContent).packages
  const globMatches = pnpmWorkspaces.flatMap((ws) => glob.globSync(ws, { absolute: false, cwd: rootDir }))
  const absGlobMatches = globMatches.map(absolute(rootDir))
  const packageJsonPaths = absGlobMatches.map((p) => pathlib.join(p, 'package.json'))
  const actualPackages = packageJsonPaths.filter(fs.existsSync)
  const absolutePaths = actualPackages.map(absolute(rootDir))
  return absolutePaths.map((p) => ({ path: p, content: pkgjson.read(p) }))
}

export const findReferences = (rootDir: string, pkgName: string) => {
  const workspaces = searchWorkspaces(rootDir)
  const dependency = workspaces.find((w) => w.content.name === pkgName)
  if (!dependency) {
    throw new Error(`Could not find package "${pkgName}"`)
  }

  const dependents = workspaces.filter((w) => w.content.dependencies?.[pkgName] || w.content.devDependencies?.[pkgName])
  return { dependency, dependents }
}
