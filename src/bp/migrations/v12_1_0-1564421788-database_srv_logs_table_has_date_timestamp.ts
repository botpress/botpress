import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { Migration } from 'core/services/migration'
import { Container } from 'inversify'

const TABLE_NAME = 'srv_logs'
const COLUMN_NAME = 'timestamp'
const CURRENT_DATE_FORMAT = 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'

const migration: Migration = {
  info: {
    description: '',
    type: 'config'
  },
  up: async (
    bp: typeof sdk,
    configProvider: ConfigProvider,
    database: Database,
    inversify: Container
  ): Promise<sdk.MigrationResult> => {
    const { client } = database.knex.client.config
    if (client === 'sqlite3') {
      return { success: true, message: 'No migration to run for sqlite' }
    }

    try {
      await database.knex.raw(
        `
        ALTER TABLE ${TABLE_NAME}
        ALTER COLUMN ${COLUMN_NAME} TYPE TIMESTAMP USING TO_TIMESTAMP(${COLUMN_NAME}, '${CURRENT_DATE_FORMAT}');
        `
      )
    } catch (err) {
      return { success: false, message: err }
    }
    return { success: true, message: 'PostgreSQL Database updated successfully' }
  }
}

export default migration
