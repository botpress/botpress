import * as sdk from 'botpress/sdk'
import { getLatestModel, pruneModels, saveModel } from 'src/backend/model-service'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Prune old models and compress old models',
    target: 'bot',
    type: 'config'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const migrateModels = async (bot: sdk.BotConfig) => {
      const ghost = bp.ghost.forBot(bot.id)

      return Promise.mapSeries(bot.languages, async lang => {
        await pruneModels(ghost, lang)
        const latestModel = await getLatestModel(ghost, lang)
        if (!latestModel) {
          return
        }
        // triggers a model compression
        return saveModel(ghost, latestModel, latestModel.hash)
      })
    }

    if (!metadata.botId) {
      const bots = await bp.bots.getAllBots()
      await Promise.map(bots.values(), migrateModels)
    }

    return { success: true, message: 'Model compression completed successfully' }
  }
}

export default migration
