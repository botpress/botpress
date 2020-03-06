import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'

const migration: Migration = {
  info: {
    description: 'Add no repeat policy in botpress config',
    target: 'core',
    type: 'config'
  },
  up: async ({ configProvider }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    await configProvider.mergeBotpressConfig({ noRepeatPolicy: true })
    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
