import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Migrates slots from type numeral to number',
    type: 'config'
  },
  up: async (bp: typeof sdk): Promise<sdk.MigrationResult> => {
    const bots = await bp.bots.getAllBots()

    for (const botId of Array.from(bots.keys())) {
      const bpfs = bp.ghost.forBot(botId)
      const intents = await bpfs.directoryListing('./intents', '*.json')
      for (const file of intents) {
        const content = await bpfs.readFileAsObject('./intents', file)
        content.slots = content.slots.map(slot => {
          if (slot.entities && slot.entities.length) {
            slot.entities = slot.entities.map(entity => (entity === 'numeral' ? 'number' : entity))
          }
          return slot
        })
        await bpfs.upsertFile('./intents', file, JSON.stringify(content, undefined, 2))
      }
    }

    return { success: true, message: 'Slots migrated successfully' }
  }
}

export default migration
