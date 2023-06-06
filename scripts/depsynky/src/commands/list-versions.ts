import { YargsConfig } from '@bpinternal/yargs-extra'
import * as util from 'util'
import * as config from '../config'
import * as utils from '../utils'

const { logger } = utils.logging

export const listVersions = (argv: YargsConfig<typeof config.listSchema>) => {
  const allPackages = utils.pnpm.searchWorkspaces(argv.rootDir)

  const versions: Record<string, string> = {}

  for (const { content } of allPackages) {
    if (content.private) {
      continue
    }
    versions[content.name] = content.version
  }

  logger.info('versions:', util.inspect(versions, { depth: Infinity, colors: true }))
}
