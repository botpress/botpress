import { BotService } from 'core/bots'
import { Migration, MigrationOpts } from 'core/migration'
import { TYPES } from 'core/types'
import { WorkspaceService } from 'core/users'

const migration: Migration = {
  info: {
    description: 'Bots requires a default language',
    type: 'config'
  },
  up: async ({ bp, configProvider, inversify }: MigrationOpts) => {
    const botService = inversify.get<BotService>(TYPES.BotService)
    const workspaceService = inversify.get<WorkspaceService>(TYPES.WorkspaceService)

    const bots = await botService.getBots()

    await Promise.mapSeries(bots.values(), async bot => {
      const updatedConfig: any = {}
      const botWorkspace = await workspaceService.getBotWorkspaceId(bot.id)
      const workspace = await workspaceService.findWorkspace(botWorkspace)
      const pipeline = workspace && workspace.pipeline

      if (!bot.defaultLanguage) {
        bp.logger.warn(
          `Bot "${bot.id}" doesn't have a default language, which is now required, go to your admin console to fix this issue.`
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
