/* eslint-disable import/order */
import './sdk/rewire'

import { createApp } from 'core/app/core-loader'
import { ModuleResolver } from 'core/modules'

export default async argv => {
  process.VERBOSITY_LEVEL = argv.verbose ? Number(argv.verbose) : -1

  const app = createApp()
  const logger = await app.logger('Extractor')
  const modules = await app.config.getModulesListConfig()
  const resolver = new ModuleResolver(logger)

  for (const entry of modules) {
    const moduleLocation = await resolver.resolve(entry.location)
    logger.info(`Module ${entry.location} is located at ${moduleLocation}`)
  }

  process.exit(0)
}
