import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const EXCEPTION = 'channel-web'
const ROOT_FOLDER = './config'

const migration: Migration = {
  info: {
    description: 'Move channel configs inside bot config',
    target: 'bot',
    type: 'config'
  },
  up: async ({ bp, metadata, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const channels: { [channelName: string]: boolean } = {}
    const config = await configProvider.getBotpressConfig()
    for (const module of config.modules) {
      const { location, enabled } = module

      if (location.includes('channel-') && !location.includes(EXCEPTION)) {
        channels[location.replace('MODULES_ROOT/channel-', '')] = enabled
      }
    }

    const updateBotChannelConfig = async (botId: string, botConfig: sdk.BotConfig) => {
      if (!botConfig.messaging) {
        ;(botConfig as any).messaging = { channels: {} }
      }

      if (!botConfig.messaging!.channels) {
        botConfig.messaging!.channels = {}
      }

      const ghost = bp.ghost.forBot(botId)
      const channelConfigsFilePath = await ghost.directoryListing(ROOT_FOLDER, 'channel-*.json')
      for (const file of channelConfigsFilePath) {
        if (file.replace('.json', '').includes(EXCEPTION)) {
          continue
        }

        const channelName = file.replace('.json', '').replace('channel-', '')
        let config = await ghost.readFileAsObject<any>(ROOT_FOLDER, file)

        // Disable channel is module was disabled
        if (channels[channelName] === false) {
          config.enabled = false
        }

        // Merge channel-messenger's global config (if it exists) with bot one.
        if (channelName === 'messenger') {
          try {
            const globalConfig = await bp.ghost.forGlobal().readFileAsObject<any>(ROOT_FOLDER, file)
            config = Object.assign(config, globalConfig)
          } catch {
            bp.logger.warn(
              'Global configuration for channel-messenger is missing. You will need manually to add the appSecret and verifyToken to your bot configuration.'
            )
          }
        }

        // Remove unsupported fields
        delete config.botPhoneNumber
        delete config.chatUserAuthDuration
        delete config.$schema

        botConfig.messaging!.channels[channelName] = config
        await ghost.deleteFile(ROOT_FOLDER, file)
      }

      await configProvider.setBotConfig(botId, botConfig)
    }

    if (metadata.botId) {
      const botConfig = await bp.bots.getBotById(metadata.botId)
      await updateBotChannelConfig(metadata.botId, botConfig!)
    } else {
      const bots = await bp.bots.getAllBots()
      for (const [botId, botConfig] of bots) {
        await updateBotChannelConfig(botId, botConfig)
      }
    }

    return { success: true, message: 'Configurations updated successfully' }
  }
}

export default migration
