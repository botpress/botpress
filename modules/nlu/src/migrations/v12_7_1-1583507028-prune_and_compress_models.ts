import * as sdk from 'botpress/sdk'

import { listModelsForLang, MODELS_DIR, pruneModels, saveModel } from '../backend/model-service'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Prune and compress old models',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanged = false
    const migrateModels = async (bot: sdk.BotConfig) => {
      const ghost = bp.ghost.forBot(bot.id)

      return Promise.mapSeries(bot.languages, async lang => {
        await pruneModels(ghost, lang)
        const modNames = await listModelsForLang(ghost, lang)

        return Promise.map(modNames, async mod => {
          try {
            const model: sdk.NLU.Model = await ghost.readFileAsObject(MODELS_DIR, mod)
            if (!model.hash) {
              return ghost.deleteFile(MODELS_DIR, mod) // model is really outdated
            }
            hasChanged = true
            return saveModel(ghost, model, model.hash) // Triggers model compression
          } catch (err) {
            // model is probably an archive
            return
          }
        })
      })
    }

    if (!metadata.botId) {
      const bots = await bp.bots.getAllBots()
      await Promise.map(bots.values(), migrateModels)
    }

    return {
      success: true,
      message: hasChanged ? 'Model compression completed successfully' : 'Nothing to compress, skipping...'
    }
  }
}

export default migration
