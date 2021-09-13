import * as sdk from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { Migration, MigrationOpts } from 'core/migration'
import { ModuleResourceLoader } from 'core/modules'
import { TYPES } from 'core/types'

const migration: Migration = {
  info: {
    description: 'Remove modules builtin and basic-skills',
    target: 'core',
    type: 'config'
  },
  up: async ({ configProvider, inversify }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const ghost = inversify.get<GhostService>(TYPES.GhostService)
    const logger = inversify.get<sdk.Logger>(TYPES.Logger)

    let hasChanges = false
    const modulesToDisable = ['builtin', 'basic-skills']
    const config = await configProvider.getBotpressConfig()

    for (const mod of modulesToDisable) {
      const entry = config.modules.find(x => x.location.endsWith(mod))

      if (entry?.enabled) {
        entry.enabled = false
        hasChanges = true

        const resourceLoader = new ModuleResourceLoader(logger, mod, ghost)
        await resourceLoader.disableResources()
      }
    }

    if (hasChanges) {
      await configProvider.setBotpressConfig(config)
    }

    return { success: true, message: 'Modules disabled successfully' }
  }
}

export default migration
