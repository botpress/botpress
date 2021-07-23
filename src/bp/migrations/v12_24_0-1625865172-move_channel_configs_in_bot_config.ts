import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const ROOT_FOLDER = './config'
const CHANNELS = ['messenger', 'slack', 'smooch', 'teams', 'telegram', 'twilio', 'vonage'] as const
const ALLOWED_CHANNEL_CONFIG: { [key in Channels]: Set<string> } = {
  messenger: new Set([
    'accessToken',
    'appSecret',
    'verifyToken',
    'disabledActions',
    'greeting',
    'getStarted',
    'persistentMenu',
    'enabled'
  ]),
  slack: new Set(['botToken', 'signingSecret', 'useRTM', 'enabled']),
  smooch: new Set(['keyId', 'secret', 'forwardRawPayloads', 'enabled']),
  teams: new Set(['appId', 'appPassword', 'tenantId', 'proactiveMessages', 'enabled']),
  telegram: new Set(['botToken', 'enabled']),
  twilio: new Set(['accountSID', 'authToken', 'enabled']),
  vonage: new Set(['apiKey', 'apiSecret', 'signatureSecret', 'applicationId', 'privateKey', 'useTestingApi', 'enabled'])
}

type Channels = typeof CHANNELS[number]

const migration: Migration = {
  info: {
    description: 'Move channel configs into bot config',
    target: 'bot',
    type: 'config'
  },
  up: async ({ bp, metadata, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const channels: { [channelName: string]: boolean } = {}
    const config = await configProvider.getBotpressConfig()
    for (const module of config.modules) {
      const { location, enabled } = module

      const channelName = location.replace('MODULES_ROOT/channel-', '')
      if (location.includes('channel-') && CHANNELS.includes(channelName as Channels)) {
        channels[channelName] = enabled
      }
    }

    const prepareBotConfig = (botConfig: sdk.BotConfig) => {
      if (!botConfig.messaging) {
        ;(botConfig as any).messaging = { channels: {} }
      }

      if (!botConfig.messaging!.channels) {
        botConfig.messaging!.channels = {}
      }
    }

    const updateBotChannelConfig = async (botId: string, botConfig: sdk.BotConfig) => {
      if (Object.keys(botConfig.messaging?.channels || {}).length) {
        bp.logger.warn(`Skipping migration for bot ${botId}. Bot configuration already contains migrated info.`)
        return
      }

      prepareBotConfig(botConfig)

      const ghost = bp.ghost.forBot(botId)
      const channelConfigsFilePath = await ghost.directoryListing(ROOT_FOLDER, 'channel-*.json')
      for (const file of channelConfigsFilePath) {
        const channelName = file.replace('.json', '').replace('channel-', '')
        if (!CHANNELS.includes(channelName as Channels)) {
          continue
        }

        let config = await ghost.readFileAsObject<any>(ROOT_FOLDER, file)

        // Disable channel if module was disabled
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

        // Remove fields that are unsupported by messaging
        Object.keys(config).forEach(key => {
          if (!ALLOWED_CHANNEL_CONFIG[channelName].has(key)) {
            delete config[key]
          }
        })

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
  },
  down: async () => {
    return { success: true, message: 'Skipping migration' }
  }
}

export default migration
