import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Adds video and audio content types to bot configs',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const bots = await bp.bots.getAllBots()
    const newTypes = ['builtin_video', 'builtin_audio']
    let hasChanges = false

    for (const [botId, botConfig] of bots) {
      const { contentTypes } = botConfig.imports

      // Fix for the previous migration which was removed
      const hasInvalidEntry = !!contentTypes.find(x => typeof x !== 'string')
      const hasMissingTypes = !newTypes.every(type => contentTypes.find(x => x === type))

      if (hasInvalidEntry || hasMissingTypes) {
        hasChanges = true
        botConfig.imports.contentTypes = _.uniq([...contentTypes.filter(x => typeof x === 'string'), ...newTypes])

        await configProvider.setBotConfig(botId, botConfig)
      }
    }

    return { success: true, message: hasChanges ? 'New types added successfully' : 'Nothing to change' }
  }
}

export default migration
