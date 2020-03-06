import * as sdk from 'botpress/sdk'

import { listModelsForLang, Model, MODELS_DIR, pruneModels, saveModel } from '../backend/model-service'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Prune and compress old models',
    target: 'bot',
    type: 'config'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const migrateModels = async (bot: sdk.BotConfig) => {
      const ghost = bp.ghost.forBot(bot.id)

      return Promise.mapSeries(bot.languages, async lang => {
        await pruneModels(ghost, lang)
        const modNames = await listModelsForLang(ghost, lang)

        return Promise.map(modNames, async mod => {
          try {
            const model: Model = await ghost.readFileAsObject(MODELS_DIR, mod)
            if (!model.hash) {
              return ghost.deleteFile(MODELS_DIR, mod) // model is really outdated
            }
            return saveModel(ghost, model, model.hash) // Triggers model compression
          } catch (err) {
            return
          }
        })
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
