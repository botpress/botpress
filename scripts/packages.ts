import * as pathlib from 'path'
import * as pkg from './package-json'

export type TargetPackage = '@botpress/client' | '@botpress/sdk' | '@botpress/cli'

export const packagePaths = {
  '@botpress/client': pathlib.join('packages', 'client'),
  '@botpress/sdk': pathlib.join('packages', 'sdk'),
  '@botpress/cli': pathlib.join('packages', 'cli'),
} satisfies Record<TargetPackage, string>

export const dependencyTree = {
  '@botpress/client': [],
  '@botpress/sdk': ['@botpress/client'],
  '@botpress/cli': ['@botpress/sdk', '@botpress/client'],
} satisfies Record<TargetPackage, TargetPackage[]>

export const currentVersions = {
  '@botpress/client': pkg.readPackage(packagePaths['@botpress/client']).version,
  '@botpress/sdk': pkg.readPackage(packagePaths['@botpress/sdk']).version,
  '@botpress/cli': pkg.readPackage(packagePaths['@botpress/cli']).version,
} satisfies Record<TargetPackage, string>
