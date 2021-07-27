import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import path from 'path'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Updates misspelled property in custom entities',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const migrateBotEntities = async (botId: string) => {
      const bpfs = bp.ghost.forBot(botId)
      const entFiles = await bpfs.directoryListing('./entities', '*.json')
      for (const fileName of entFiles) {
        const entityDef = (await bpfs.readFileAsObject('./entities', fileName)) as sdk.NLU.EntityDefinition
        entityDef.occurrences = _.cloneDeep(entityDef['occurences'])
        delete entityDef['occurences']
        await bpfs.upsertFile('./entities', fileName, JSON.stringify(entityDef, undefined, 2), { ignoreLock: true })
      }
    }
    if (metadata.botId) {
      await migrateBotEntities(metadata.botId)
    } else {
      const bots = await bp.bots.getAllBots()
      await Promise.map(bots.keys(), botId => migrateBotEntities(botId))
    }

    return { success: true, message: "Entities' properties updated successfully" }
  },

  down: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    bp.logger.warn(`No down migration written for ${path.basename(__filename)}`)
    return {
      success: true,
      message: 'No down migration written.'
    }
  }
}

export default migration
