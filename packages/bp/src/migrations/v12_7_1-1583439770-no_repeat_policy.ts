import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Add no repeat policy in botpress config',
    target: 'core',
    type: 'config'
  },
  up: async ({ configProvider }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()
    if (config.noRepeatPolicy === undefined) {
      await configProvider.mergeBotpressConfig({ noRepeatPolicy: true })
      return { success: true, message: 'Configuration updated successfully' }
    } else {
      return { success: true, message: 'Field already exists, skipping...' }
    }
  }
}

export default migration
