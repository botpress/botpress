/* eslint-disable import/order */
import './sdk/rewire'

import { Config, Logger } from 'core/app/core-loader'
import { ModuleResolver } from 'core/modules'

export default async argv => {
  process.VERBOSITY_LEVEL = argv.verbose ? Number(argv.verbose) : -1

  const logger = await Logger('Extractor')
  const modules = await Config.getModulesListConfig()
  const resolver = new ModuleResolver(logger)

  for (const entry of modules) {
    const moduleLocation = await resolver.resolve(entry.location)
    logger.info(`Module ${entry.location} is located at ${moduleLocation}`)
  }

  process.exit(0)
}
