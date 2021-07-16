import * as sdk from 'botpress/sdk'
import { ModuleConfigEntry } from 'core/config'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

const EXCEPTION = 'channel-web'

const migration: Migration = {
  info: {
    description: 'Remove channels from list of modules in botpress config',
    target: 'core',
    type: 'config'
  },
  up: async ({ configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()
    const modules: ModuleConfigEntry[] = []

    for (const module of config.modules) {
      const { location, enabled } = module

      if (!location.includes('channel-') || location.includes(EXCEPTION)) {
        modules.push({ location, enabled })
      }
    }

    config.modules = modules
    await configProvider.setBotpressConfig(config)

    return { success: true, message: 'Configuration updated successfully' }
  },
  down: async ({ bp, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()

    const modules = await configProvider.getModulesListConfig()

    for (const module of modules) {
      const { location, enabled } = module

      if (!location.includes('channel-') || location.includes(EXCEPTION)) {
        continue
      }

      config.modules.push({ location, enabled })
    }

    config.modules = _.sortBy(config.modules, m => m.location)
    await configProvider.setBotpressConfig(config)

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
