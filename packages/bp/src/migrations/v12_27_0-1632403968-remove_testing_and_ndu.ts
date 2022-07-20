import * as sdk from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { Migration, MigrationOpts } from 'core/migration'
import { ModuleResourceLoader } from 'core/modules'
import { TYPES } from 'core/types'

const migration: Migration = {
  info: {
    description: 'Remove Testing and NDU module entries',
    target: 'core',
    type: 'config'
  },
  up: async ({ configProvider, inversify }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const ghost = inversify.get<GhostService>(TYPES.GhostService)
    const logger = inversify.get<sdk.Logger>(TYPES.Logger)

    const modulesToRemove = ['testing', 'ndu']
    const config = await configProvider.getBotpressConfig()

    for (const mod of modulesToRemove) {
      const index = config.modules.findIndex(x => x.location.endsWith(mod))
      config.modules.splice(index, 1)

      const resourceLoader = new ModuleResourceLoader(logger, mod, ghost)
      await resourceLoader.disableResources()
    }

    await configProvider.setBotpressConfig(config)

    return { success: true, message: 'Module entries successfully removed' }
  },
  down: async ({ configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const moduleEntriesToRestore = [
      {
        location: 'MODULES_ROOT/testing',
        enabled: false
      },
      {
        location: 'MODULES_ROOT/ndu',
        enabled: false
      }
    ]
    const config = await configProvider.getBotpressConfig()
    config.modules = [...moduleEntriesToRestore, ...config.modules]

    await configProvider.setBotpressConfig(config)

    return { success: true, message: 'Module entries successfully restored' }
  }
}

export default migration
