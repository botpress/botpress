import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Adds video and audio content types to bot configs',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, configProvider }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const bots = await bp.bots.getAllBots()
    for (const [botId, botConfig] of bots) {
      configProvider.mergeBotConfig(botId, {
        imports: { contentTypes: [...botConfig.imports.contentTypes, 'builtin_video', 'builtin_audio'] }
      })
    }

    return { success: true, message: 'Bot configurations updated successfully' }
  }
}

export default migration
