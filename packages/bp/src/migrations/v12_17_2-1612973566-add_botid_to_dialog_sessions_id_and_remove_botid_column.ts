import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'

const TABLE_NAME = 'dialog_sessions'
const TEMP_TABLE_NAME = 'dialog_sessions_temp'

const migration: Migration = {
  info: {
    description: 'Merge botId column into dialog_sessions id',
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
      const hasBotIdColumn = await db.schema.hasColumn(TABLE_NAME, 'botId')
      if (!hasBotIdColumn) {
        return { success: true, message: 'Column botId already merged, skipping...' }
      }

      if (client === 'sqlite3') {
        await db.transaction(async trx => {
          await db.schema.transacting(trx).createTable(TEMP_TABLE_NAME, table => {
            table.text('id').notNullable()
            table.json('context').notNullable()
            table.json('temp_data').notNullable()
            table.json('session_data').notNullable()
            table.timestamp('context_expiry').nullable()
            table.timestamp('session_expiry').nullable()
            table.timestamp('created_on').notNullable()
            table.timestamp('modified_on').notNullable()
            table.primary(['id'])
          })

          await trx.raw(
            `INSERT INTO ${TEMP_TABLE_NAME} SELECT botId || '::' || id AS id, context, temp_data, session_data, context_expiry, session_expiry, created_on, modified_on FROM ${TABLE_NAME};`
          )

          await database.knex.schema.transacting(trx).dropTable(TABLE_NAME)
          await database.knex.schema.transacting(trx).renameTable(TEMP_TABLE_NAME, TABLE_NAME)
        })
      } else {
        await db.transaction(async trx => {
          await trx.raw(`ALTER TABLE ${TABLE_NAME} ALTER COLUMN id TYPE TEXT;`)
          await trx.raw(`UPDATE ${TABLE_NAME} SET id = "botId" || '::' || "id";`)
          await trx.raw(`ALTER TABLE ${TABLE_NAME} DROP CONSTRAINT ${TABLE_NAME}_pkey;`)
          await trx.raw(`ALTER TABLE ${TABLE_NAME} ADD PRIMARY KEY (id);`)
          await trx.raw(`ALTER TABLE ${TABLE_NAME} DROP COLUMN "botId";`)
        })
      }
    } catch (err) {
      bp.logger.attachError(err).error('Could not update the primary keys')
      return { success: false, message: 'Could not update the primary keys' }
    }
    return { success: true, message: 'Primary keys successfully updated' }
  }
}

export default migration
