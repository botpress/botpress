import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

const ROOT_FOLDER = './config'
const CHANNELS = ['messenger', 'slack', 'smooch', 'teams', 'telegram', 'twilio', 'vonage'] as const
type Channels = typeof CHANNELS[number]

const migration: Migration = {
  info: {
    description: 'Remove all global configs channel related',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const channelConfigsFilePath = await bp.ghost.forGlobal().directoryListing(ROOT_FOLDER, 'channel-*.json')
    for (const file of channelConfigsFilePath) {
      const channelName = file.replace('.json', '').replace('channel-', '')
      if (!CHANNELS.includes(channelName as Channels)) {
        continue
      }

      await bp.ghost.forGlobal().deleteFile(ROOT_FOLDER, file)
    }

    return { success: true, message: 'Configurations removed successfully' }
  },
  down: async (): Promise<sdk.MigrationResult> => {
    return { success: true, message: 'Nothing to do skipping.' }
  }
}

export default migration
