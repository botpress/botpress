import * as consts from '../constants'
import * as pkg from '../utils/package-json'

export const currentVersions = {
  '@botpress/client': pkg.readPackage(consts.PACKAGE_PATHS['@botpress/client']).version,
  '@botpress/sdk': pkg.readPackage(consts.PACKAGE_PATHS['@botpress/sdk']).version,
  '@botpress/cli': pkg.readPackage(consts.PACKAGE_PATHS['@botpress/cli']).version,
} satisfies Record<consts.TargetPackage, string>
