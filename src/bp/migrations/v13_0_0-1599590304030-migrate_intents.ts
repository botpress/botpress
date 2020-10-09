import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'
import _ from 'lodash'

const INTENT_DIR = 'intents'
const FLOW_DIR = 'flows'

const migration: Migration = {
  info: {
    description: 'Migrate intents to new ".intents.qna" format',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      if (metadata.botId) {
        await updateBot(bp, metadata.botId)
      } else {
        const bots = await bp.bots.getAllBots()
        for (const botId of Array.from(bots.keys())) {
          await updateBot(bp, botId)
        }
      }
      return { success: true, message: 'Intents updated successfully' }
    } catch (err) {
      return { success: false, message: `Intent migration could not finish due to error: ${err.message}` }
    }
  }
}
export default migration

async function updateBot(bp: typeof sdk, botId: string): Promise<void> {
  const ghost = bp.ghost.forBot(botId)
  const intentFiles = await ghost.directoryListing(INTENT_DIR, '*.json')
  for (const file of intentFiles) {
    // enable intent
    const intent = await ghost.readFileAsObject<sdk.NLU.IntentDefinition>(INTENT_DIR, file)
    intent.metadata = { ...intent.metadata, enabled: true }

    // rename and move
    const newName = file.replace(/.json$/g, '.intents.json')
    await ghost.upsertFile(FLOW_DIR, newName, JSON.stringify(intent, null, 2))

    // rm previous file
    await ghost.deleteFile(INTENT_DIR, file)
  }
  // TODO: should also delete directory at the end
}
