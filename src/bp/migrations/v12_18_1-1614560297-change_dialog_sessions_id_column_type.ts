import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'

const TABLE_NAME = 'dialog_sessions'
const TEMP_TABLE_NAME = 'dialog_sessions_temp'
const ID_COLUMN_TYPE = 'text'

interface PostgreSQLColumnInfo {
  type: string
}

// https://www.oreilly.com/library/view/using-sqlite/9781449394592/re205.html
interface SQLiteColumnInfo {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: string | null
  pk: number
}
type SQLiteTableInfo = SQLiteColumnInfo[]

const migration: Migration = {
  info: {
    description: 'Change dialog_sessions id column type',
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

    const noMigrationNeeded = { success: true, message: 'PK column type already changed, skipping...' }

    try {
      if (client === 'sqlite3') {
        const tableInfo = await db.raw<SQLiteTableInfo>(`PRAGMA table_info([${TABLE_NAME}])`)
        const idColumn = tableInfo.find(column => column.name === 'id')!

        if (idColumn.type.toLowerCase() === ID_COLUMN_TYPE) {
          return noMigrationNeeded
        }

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
            `INSERT INTO ${TEMP_TABLE_NAME} SELECT id, context, temp_data, session_data, context_expiry, session_expiry, created_on, modified_on FROM ${TABLE_NAME};`
          )

          await database.knex.schema.transacting(trx).dropTable(TABLE_NAME)
          await database.knex.schema.transacting(trx).renameTable(TEMP_TABLE_NAME, TABLE_NAME)
        })
      } else {
        const idColumnInfo = await db.raw<{ rows: PostgreSQLColumnInfo[] }>(
          `SELECT data_type as type FROM information_schema.columns WHERE table_name = '${TABLE_NAME}' and column_name = 'id'`
        )

        if (idColumnInfo.rows[0].type.toLowerCase() === ID_COLUMN_TYPE) {
          return noMigrationNeeded
        }

        await db.transaction(async trx => {
          await trx.raw(`ALTER TABLE ${TABLE_NAME} ALTER COLUMN id TYPE ${ID_COLUMN_TYPE};`)
        })
      }
    } catch (err) {
      bp.logger.attachError(err).error('Could not update the primary key')
      return { success: false, message: 'Could not update the primary key' }
    }
    return { success: true, message: 'Primary key successfully updated' }
  }
}

export default migration
