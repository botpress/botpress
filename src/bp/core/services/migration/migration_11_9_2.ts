import * as sdk from 'botpress/sdk'
import { BotConfig } from 'core/config/bot.config'

import { ConfigProvider } from '../../config/config-loader'
import { BotService } from '../bot-service'
import { WorkspaceService } from '../workspace-service'

import { MigrationStep } from '.'

export default class Migration implements MigrationStep {
  constructor(
    private logger,
    private configProvider: ConfigProvider,
    private botService: BotService,
    private workspaceService: WorkspaceService
  ) {}

  public async execute(dryRun?: boolean): Promise<sdk.MigrationStatus> {
    const bots = await this.botService.getBots()
    const pipeline = await this.workspaceService.getPipeline()

    const hasChanges = await this._ensureBotConfigCorrect(bots, pipeline[0], dryRun)

    return {
      hasConfigChanges: hasChanges,
      hasFileChanges: false
    }
  }

  // @deprecated > 11: bot will always include default pipeline stage
  private async _ensureBotConfigCorrect(
    bots: Map<string, BotConfig>,
    stage: sdk.Stage,
    dryRun?: boolean
  ): Promise<boolean> {
    let hasChanges = false
    await Promise.mapSeries(bots.values(), async bot => {
      const updatedConfig: any = {}

      if (!bot.defaultLanguage) {
        this.logger.warn(
          `Bot "${
            bot.id
          }" doesn't have a default language, which is now required, go to your admin console to fix this issue.`
        )
        updatedConfig.disabled = true
      }

      if (!bot.pipeline_status) {
        updatedConfig.locked = false
        updatedConfig.pipeline_status = {
          current_stage: {
            id: stage.id,
            promoted_by: 'system',
            promoted_on: new Date()
          }
        }
      }

      if (Object.getOwnPropertyNames(updatedConfig).length) {
        hasChanges = true

        if (!dryRun) {
          await this.configProvider.mergeBotConfig(bot.id, updatedConfig)
        }
      }
    })

    return hasChanges
  }
}
