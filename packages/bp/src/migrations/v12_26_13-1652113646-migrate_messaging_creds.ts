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
      const move = async () => {
        if (!botConfig.messaging) {
          return bp.logger.warn(`[${botId}] No messaging config to migrate`)
        } else if (!botConfig.messaging.id?.length) {
          return bp.logger.warn(`[${botId}] No messaging clientId to migrate`)
        } else if (!botConfig.messaging.token?.length) {
          return bp.logger.warn(`[${botId}] No messaging clientToken to migrate`)
        }

        await bp
          .database('srv_channels')
          .where({ clientId: botConfig.messaging.id })
          .del()
        await bp
          .database('srv_channels')
          .where({ botId })
          .del()

        await bp.database('srv_channels').insert({
          botId,
          clientId: botConfig.messaging.id,
          clientToken: botConfig.messaging.token,
          config: bp.database.json.set({})
        })
      }

      try {
        await move()
      } catch (e) {
        bp.logger
          .attachError(e)
          .error(`[${botId}] Failed to move messaging credentials to srv_channels. New credentials willl be generated`)
      }

      if (botConfig.messaging) {
        delete botConfig.messaging.id
        delete botConfig.messaging.token
      }

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
