import * as sdk from 'botpress/sdk'

import { FuzzyTolerance } from '../backend/entities/validation'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Adds missing fields in custom entities',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const migrateBotEntities = async (botId: string) => {
      const bpfs = bp.ghost.forBot(botId)
      const entFiles = await bpfs.directoryListing('./entities', '*.json')
      for (const fileName of entFiles) {
        const entityDef = (await bpfs.readFileAsObject('./entities', fileName)) as sdk.NLU.EntityDefinition
        if (entityDef.type === 'pattern') {
          if (entityDef.matchCase === undefined) {
            entityDef.matchCase = false
          }
          if (entityDef.examples === undefined) {
            entityDef.examples = []
          }
        }

        if (entityDef.type === 'list') {
          if (entityDef.fuzzy) {
            entityDef.fuzzy = FuzzyTolerance.Medium
          } else {
            entityDef.fuzzy = FuzzyTolerance.Strict
          }
        }

        await bpfs.upsertFile('./entities', fileName, JSON.stringify(entityDef, undefined, 2), { ignoreLock: true })
      }
    }
    if (metadata.botId) {
      await migrateBotEntities(metadata.botId)
    } else {
      const bots = await bp.bots.getAllBots()
      await Promise.map(bots.keys(), botId => migrateBotEntities(botId))
    }

    return { success: true, message: "Entities' fields updated successfully" }
  }
}

export default migration
