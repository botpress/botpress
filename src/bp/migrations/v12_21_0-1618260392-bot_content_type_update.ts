import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Adds video and audio content types to bot configs',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, configProvider }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const bots = await bp.bots.getAllBots()
    const newTypes = ['builtin_video', 'builtin_audio']

    for (const [botId, botConfig] of bots) {
      if (_.difference(newTypes, botConfig.imports.contentTypes).length > 0) {
        configProvider.mergeBotConfig(botId, {
          imports: { contentTypes: [...botConfig.imports.contentTypes, ...newTypes] }
        })
      }
    }

    return { success: true, message: 'Bot configurations updated successfully' }
  }
}

export default migration
