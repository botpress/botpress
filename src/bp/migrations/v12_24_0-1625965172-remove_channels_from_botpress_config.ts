import * as sdk from 'botpress/sdk'
import { ModuleConfigEntry } from 'core/config'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

const CHANNELS = ['messenger', 'slack', 'smooch', 'teams', 'telegram', 'twilio', 'vonage'] as const
type Channels = typeof CHANNELS[number]

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

      const channelName = location.replace('MODULES_ROOT/channel-', '')
      if (!CHANNELS.includes(channelName as Channels)) {
        modules.push({ location, enabled })
      }
    }

    config.modules = modules
    await configProvider.setBotpressConfig(config)

    return { success: true, message: 'Configuration updated successfully' }
  },
  down: async ({ bp, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    bp.logger.warn('Please note that all channels will be disabled after running this migration!')

    const config = await configProvider.getBotpressConfig()

    for (const channel of CHANNELS) {
      const location = `MODULES_ROOT/channel-${channel}`
      const enabled = false

      config.modules.push({ location, enabled })
    }

    config.modules = _.sortBy(config.modules, m => m.location)
    await configProvider.setBotpressConfig(config)

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
