import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { Migration } from 'core/services/migration'
import { Container } from 'inversify'

const TABLE_NAME = 'srv_logs'
const COLUMN_NAME = 'timestamp'

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
    // I'm a little lost here which implementation should I use?
    migrateByCreatingNewColumnOnly(database) // this one
    // migrateByDroppingTheWholeTable(database) // or this one ?

    return { success: true, message: 'Configuration updated successfully' }
  }
}

async function migrateByDroppingTheWholeTable(database: Database) {
  // get all logs
  let logs: sdk.LoggerEntry[] = await database.knex.select().from(TABLE_NAME)
  logs = logs.map((log: sdk.LoggerEntry) => ({
    ...log,
    timestamp: database.knex.date.format(log)
  }))

  // delete table
  database.knex.schema.dropTable(TABLE_NAME)

  // create and fill the new table
  await database.knex.createTableIfNotExists(TABLE_NAME, table => {
    table.string('botId').nullable()
    table.timestamp('timestamp')
    table.string('level')
    table.string('scope')
    table.text('message')
    table.text('metadata')
  })
  await database.knex.batchInsert(TABLE_NAME, logs)
}

async function migrateByCreatingNewColumnOnly(database: Database) {
  const tempName = COLUMN_NAME + '_temp'

  // rename timestamp column to temp
  await database.knex.schema.alterTable(TABLE_NAME, table => {
    table.renameColumn(COLUMN_NAME, tempName)
  })

  // create new column with correct type
  await database.knex.schema.alterTable(TABLE_NAME, table => {
    table.timestamp(COLUMN_NAME)
  })

  // fill the new column with temp using the knex extension to format
  const format = database.knex.date.format
  await database.knex(TABLE_NAME).update({
    [COLUMN_NAME]: format(database.knex.raw('??', [tempName]))
  })
}

export default migration
