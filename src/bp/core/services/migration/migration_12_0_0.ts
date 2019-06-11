import * as sdk from 'botpress/sdk'

import { ConfigProvider } from '../../config/config-loader'

import { MigrationStep } from '.'

export default class Migration implements MigrationStep {
  constructor(private configProvider: ConfigProvider) {}

  public async execute(dryRun?: boolean): Promise<sdk.MigrationStatus> {
    const migrationStatus = {
      hasConfigChanges: false,
      hasFileChanges: false
    }

    const config = await this.configProvider.getBotpressConfig()
    if (!config.eventCollector) {
      if (!dryRun) {
        await this.configProvider.mergeBotpressConfig({
          eventCollector: {
            enabled: true,
            collectionInterval: '5s',
            retentionPeriod: '30d',
            ignoredEventTypes: ['visit', 'typing']
          }
        })
      }

      migrationStatus.hasConfigChanges = true
    }

    return migrationStatus
  }
}
