import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Remove QNA module',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()
    const qnaEntry = config.modules.find(x => x.location.endsWith('qna'))

    // When QNA is disabled, we disable it individually for each bots so the behavior is consistent after the migration
    if (!qnaEntry?.enabled) {
      for (const [botId, botConfig] of await bp.bots.getAllBots()) {
        await configProvider.setBotConfig(botId, { ...botConfig, qna: { disabled: true } })
      }
    }

    config.modules = config.modules.filter(x => x.location !== qnaEntry?.location)
    await configProvider.setBotpressConfig(config)

    return { success: true, message: 'Configuration updated successfully' }
  },
  down: async ({ bp, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    let enabled = 0
    for (const [botId, botConfig] of await bp.bots.getAllBots()) {
      if (!botConfig.qna?.disabled) {
        enabled++
      }
    }

    const config = await configProvider.getBotpressConfig()
    config.modules = [
      ...config.modules.filter(x => !x.location.endsWith('qna')),
      { location: 'MODULES_ROOT/qna', enabled: enabled > 0 }
    ]

    await configProvider.setBotpressConfig(config)
    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
