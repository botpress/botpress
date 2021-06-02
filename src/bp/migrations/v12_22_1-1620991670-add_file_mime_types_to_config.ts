import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

const DEFAULT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'video/mp4']
const WANTED_MIME_TYPES = DEFAULT_MIME_TYPES.concat(['application/pdf'])

const migration: Migration = {
  info: {
    description: 'Adds file mime types to config',
    target: 'core',
    type: 'config'
  },
  up: async ({ configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()

    // We only do the migration if the settings are at default
    if (_.difference(config.fileUpload.allowedMimeTypes, DEFAULT_MIME_TYPES).length > 0) {
      return { success: true, message: 'Skipping migration for non-default settings' }
    }

    await configProvider.mergeBotpressConfig({
      fileUpload: {
        allowedMimeTypes: WANTED_MIME_TYPES
      }
    })

    return { success: true, message: 'Configuration updated successfully' }
  },
  down: async ({ configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()

    // We only do the migration if the settings are at default
    if (_.difference(config.fileUpload.allowedMimeTypes, WANTED_MIME_TYPES).length > 0) {
      return { success: true, message: 'Skipping migration for non-default settings' }
    }

    config.fileUpload.allowedMimeTypes = DEFAULT_MIME_TYPES

    await configProvider.setBotpressConfig(config)

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
