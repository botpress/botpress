import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Migrates the messaging clientId and clientToken from bot.config.json to srv_channels',
    target: 'bot',
    type: 'config'
  },

  up: async ({ bp, metadata, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const migration = async (botId: string, botConfig: any) => {
      await bp.database('srv_channels').insert({
        botId,
        clientId: botConfig.messaging.id,
        clientToken: botConfig.messaging.token,
        config: bp.database.json.set({})
      })

      delete botConfig.messaging.id
      delete botConfig.messsaging.token
      await configProvider.setBotConfig(botId, botConfig)
    }

    if (metadata.botId) {
      const botConfig = await bp.bots.getBotById(metadata.botId)
      await migration(metadata.botId, botConfig!)
    } else {
      const bots = await bp.bots.getAllBots()
      for (const [botId, botConfig] of bots) {
        await migration(botId, botConfig)
      }
    }

    return { success: true, message: 'Configurations updated successfully' }
  },

  down: async ({ metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    throw 'impl'
  }
}

export default migration
