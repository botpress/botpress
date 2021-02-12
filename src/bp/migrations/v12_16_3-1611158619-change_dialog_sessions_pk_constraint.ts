import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'

const TABLE_NAME = 'dialog_sessions'
const TEMP_TABLE_NAME = 'dialog_sessions_temp'

const migration: Migration = {
  info: {
    description: 'Change dialog_sessions pk constraint to include botId',
    target: 'core',
    type: 'database'
  },
  up: async ({
    bp,
    configProvider,
    database,
    inversify,
    metadata
  }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const db = database.knex as sdk.KnexExtended
    const { client } = db.client.config

    try {
      if (client === 'sqlite3') {
        await db.transaction(async trx => {
          await db.schema.transacting(trx).createTable(TEMP_TABLE_NAME, table => {
            table.string('id').notNullable()
            table.string('botId').notNullable()
            table.json('context').notNullable()
            table.json('temp_data').notNullable()
            table.json('session_data').notNullable()
            table.timestamp('context_expiry').nullable()
            table.timestamp('session_expiry').nullable()
            table.timestamp('created_on').notNullable()
            table.timestamp('modified_on').notNullable()
            table.primary(['id', 'botId'])
          })

          await trx.raw(`INSERT INTO ${TEMP_TABLE_NAME} SELECT * FROM ${TABLE_NAME};`)
          await database.knex.schema.transacting(trx).dropTable(TABLE_NAME)
          await database.knex.schema.transacting(trx).renameTable(TEMP_TABLE_NAME, TABLE_NAME)
        })
      } else {
        await db.transaction(async trx => {
          await trx.raw(`ALTER TABLE ${TABLE_NAME} DROP CONSTRAINT ${TABLE_NAME}_pkey;`)
          await trx.raw(`ALTER TABLE ${TABLE_NAME} ADD PRIMARY KEY (id, "botId");`)
        })
      }
    } catch (err) {
      bp.logger.attachError(err).error('Could not update the primary key constraint')
      return { success: false, message: 'Could not update the primary key constraint' }
    }
    return { success: true, message: 'Primary key constraint successfully updated' }
  }
}

export default migration
