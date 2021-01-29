import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'

const TABLE_NAME = 'srv_migrations'
const TEMP_TABLE_NAME = 'srv_migrations_temp'

const migration: Migration = {
  info: {
    description: 'Fix migration table field type',
    target: 'core',
    type: 'database'
  },
  up: async ({ database }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const db = database.knex as sdk.KnexExtended

    const { client } = db.client.config
    let columnType

    if (db.isLite) {
      const tableInfo = await db.raw(`PRAGMA table_info([${TABLE_NAME}])`)
      columnType = tableInfo[3].type
    } else {
      const query = await db('information_schema.columns')
        .select('data_type')
        .where({ table_name: TABLE_NAME, column_name: 'details' })
        .first()

      columnType = query.data_type
    }

    if (columnType === 'text') {
      return { success: true, message: 'Field already fixed' }
    }

    if (!db.isLite) {
      await db.raw('ALTER TABLE srv_migrations ALTER COLUMN details TYPE text')
    } else {
      await db.transaction(async trx => {
        await db.schema.transacting(trx).createTableIfNotExists('srv_migrations_temp', table => {
          table.increments('id')
          table.string('initialVersion')
          table.string('targetVersion')
          table.text('details')
          table.timestamps(true, true)
        })

        await trx.raw(`
          INSERT OR IGNORE INTO
            ${TEMP_TABLE_NAME} (id, initialVersion, targetVersion, details, created_at, updated_at)
          SELECT
            *
          FROM ${TABLE_NAME}`)

        await database.knex.schema.transacting(trx).dropTable(TABLE_NAME)
        await database.knex.schema.transacting(trx).renameTable(TEMP_TABLE_NAME, TABLE_NAME)
      })
    }

    return { success: true, message: 'Field type changed successfully' }
  }
}

export default migration
