import * as pathlib from 'path'

export const SCRIPTS_DIR = __dirname
export const ROOT_DIR = pathlib.resolve(SCRIPTS_DIR, '..')

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
