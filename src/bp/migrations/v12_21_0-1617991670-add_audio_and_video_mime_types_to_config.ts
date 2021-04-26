import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Adds audio and video mime types to config',
    target: 'core',
    type: 'config'
  },
  up: async ({ configProvider }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()

    // We only do the migration if the settings are at default
    if (
      config.fileUpload.maxFileSize !== '10mb' ||
      _.difference(config.fileUpload.allowedMimeTypes, ['image/jpeg', 'image/png', 'image/gif']).length > 0
    ) {
      return { success: true, message: 'Skipping migration for non-default settings' }
    }

    await configProvider.mergeBotpressConfig({
      fileUpload: {
        maxFileSize: '25mb',
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'video/mp4']
      }
    })

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
