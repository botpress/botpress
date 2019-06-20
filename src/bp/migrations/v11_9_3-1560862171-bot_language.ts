import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { BotService } from 'core/services/bot-service'
import { Migration } from 'core/services/migration'
import { WorkspaceService } from 'core/services/workspace-service'
import { TYPES } from 'core/types'
import { Container } from 'inversify'

const migration: Migration = {
  info: {
    description: 'Bots requires a default language',
    type: 'config'
  },
  up: async (bp: typeof sdk, configProvider: ConfigProvider, database: Database, container: Container) => {
    const botService = container.get<BotService>(TYPES.BotService)
    const workspaceService = container.get<WorkspaceService>(TYPES.WorkspaceService)

    const bots = await botService.getBots()

    await Promise.mapSeries(bots.values(), async bot => {
      const updatedConfig: any = {}
      const botWorkspace = await workspaceService.getBotWorkspaceId(bot.id)
      const workspace = await workspaceService.findWorkspace(botWorkspace)
      const pipeline = workspace && workspace.pipeline

      if (!bot.defaultLanguage) {
        bp.logger.warn(
          `Bot "${
            bot.id
          }" doesn't have a default language, which is now required, go to your admin console to fix this issue.`
        )
        updatedConfig.disabled = true
      }

      if (!bot.pipeline_status && pipeline) {
        updatedConfig.locked = false
        updatedConfig.pipeline_status = {
          current_stage: {
            id: pipeline[0].id,
            promoted_by: 'system',
            promoted_on: new Date()
          }
        }
      }

      if (Object.getOwnPropertyNames(updatedConfig).length) {
        await configProvider.mergeBotConfig(bot.id, updatedConfig)
      }
    })

    return { success: true, message: 'Bot configuration updated' }
  }
}

export default migration
