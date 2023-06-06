import * as fs from 'fs'
import * as glob from 'glob'
import * as pathlib from 'path'
import * as yaml from 'yaml'
import * as consts from '../constants'
import * as pkg from '../utils/package-json'

const pnpmWorkspacesFile = pathlib.join(consts.ROOT_DIR, 'pnpm-workspace.yaml')
const pnpmWorkspacesContent = fs.readFileSync(pnpmWorkspacesFile, 'utf-8')
const pnpmWorkspaces: string[] = yaml.parse(pnpmWorkspacesContent).packages

const globMatches = pnpmWorkspaces.flatMap((ws) => glob.globSync(ws, { absolute: false, cwd: consts.ROOT_DIR }))
export const allPackages = globMatches.filter((ws) => pkg.isPackage(ws))
