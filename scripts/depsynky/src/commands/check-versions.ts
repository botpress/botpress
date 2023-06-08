import { YargsConfig } from '@bpinternal/yargs-extra'
import * as config from '../config'
import * as errors from '../errors'
import * as utils from '../utils'

const { logger } = utils.logging

export type CheckVersionsOpts = {
  targetVersions: Record<string, string>
}

const LOCAL_VERSION = 'workspace:*'

type CheckReport = { name: string; currentVersion: string; targetVersion: string }
const check = (current: Record<string, string>, target: Record<string, string>): CheckReport | undefined => {
  for (const [name, version] of utils.objects.entries(target)) {
    const currentVersion = current[name]
    if (currentVersion && currentVersion !== LOCAL_VERSION && currentVersion !== version) {
      return {
        name,
        currentVersion,
        targetVersion: version,
      }
    }
  }

  return
}

export const checkVersions = (argv: YargsConfig<typeof config.checkSchema>, opts: Partial<CheckVersionsOpts> = {}) => {
  const allPackages = utils.pnpm.searchWorkspaces(argv.rootDir)
  const targetVersions = opts.targetVersions ?? utils.pnpm.versions(allPackages)

  for (const {
    path: pkgPath,
    content: { name: pkgName },
  } of allPackages) {
    const { dependencies, devDependencies } = utils.pkgjson.read(pkgPath)

    const depReport = dependencies && check(dependencies, targetVersions)
    if (depReport) {
      throw new errors.DepSynkyError(
        `Dependency ${depReport.name} is out of sync in ${pkgName}: ${depReport.currentVersion} != ${depReport.targetVersion}`
      )
    }

    const devDepReport = devDependencies && check(devDependencies, targetVersions)
    if (devDepReport) {
      throw new errors.DepSynkyError(
        `Dev dependency ${devDepReport.name} is out of sync in ${pkgName}: ${devDepReport.currentVersion} != ${devDepReport.targetVersion}`
      )
    }
  }

  logger.info('All versions are in sync')
}
