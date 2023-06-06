import { YargsConfig } from '@bpinternal/yargs-extra'
import * as config from '../config'
import * as utils from '../utils'

const { logger } = utils.logging

export type CheckVersionsOpts = {
  targetVersions: Record<string, string>
}

export const checkVersions = (argv: YargsConfig<typeof config.checkSchema>, opts: Partial<CheckVersionsOpts> = {}) => {
  const allPackages = utils.pnpm.searchWorkspaces(argv.rootDir)
  const targetVersions = opts.targetVersions ?? utils.pnpm.versions(allPackages)

  for (const { path: pkgPath } of allPackages) {
    const { dependencies, devDependencies } = utils.pkgjson.read(pkgPath)

    for (const [name, version] of Object.entries(targetVersions)) {
      if (dependencies && dependencies[name] && dependencies[name] !== version) {
        throw new Error(`Dependency ${name} is out of sync in ${pkgPath}: ${dependencies[name]} != ${version}`)
      }

      if (devDependencies && devDependencies[name] && devDependencies[name] !== version) {
        throw new Error(`Dev dependency ${name} is out of sync in ${pkgPath}: ${devDependencies[name]} != ${version}`)
      }
    }
  }

  logger.info('All versions are in sync')
}
