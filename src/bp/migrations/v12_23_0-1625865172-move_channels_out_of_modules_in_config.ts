import * as sdk from 'botpress/sdk'
import { ModuleConfigEntry, ChannelConfigEntry } from 'core/config'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Move channels out of the modules section in config',
    target: 'core',
    type: 'config'
  },
  up: async ({ configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()

    if (config.channels?.length) {
      return { success: true, message: 'Skipping migration nothing to change' }
    }

    const channels: ChannelConfigEntry[] = []
    const modules: ModuleConfigEntry[] = []

    for (const module of config.modules) {
      const { location, enabled } = module

      if (location.includes('channel-')) {
        channels.push({ name: location.replace('MODULES_ROOT/channel-', ''), enabled })
      } else {
        modules.push({ location, enabled })
      }
    }

    config.modules = modules
    config.channels = channels

    await configProvider.setBotpressConfig(config)

    return { success: true, message: 'Configuration updated successfully' }
  },
  down: async ({ configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()

    if (!config.channels) {
      return { success: true, message: 'Skipping migration nothing to change' }
    }

    for (const channel of config.channels) {
      const { name, enabled } = channel

      config.modules.push({ location: `MODULES_ROOT/channel-${name}`, enabled })
    }
    config.modules = _.sortBy(config.modules, m => m.location)
    delete (config as any).channels

    await configProvider.setBotpressConfig(config)

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
