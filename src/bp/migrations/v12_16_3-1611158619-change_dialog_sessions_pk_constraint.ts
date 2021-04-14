import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'
import _ from 'lodash'

const TABLE_NAME = 'dialog_sessions'
const TEMP_TABLE_NAME = 'dialog_sessions_temp'
const PK_COLUMNS = ['botId', 'id'].sort() // needs to be sorted alphabetically

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

interface PostgreSQLPKInfo {
  name: string
}
type PostgreSQLTablePK = PostgreSQLPKInfo[]

const migration: Migration = {
  info: {
    description: 'Change dialog_sessions PK constraint to include botId',
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
      const noMigrationNeeded = { success: true, message: 'PK constraint already changed, skipping...' }

      const hasBotIdColumn = await db.schema.hasColumn(TABLE_NAME, 'botId')
      if (!hasBotIdColumn) {
        return noMigrationNeeded
      }

      if (client === 'sqlite3') {
        const tableInfo = (await db.raw(`PRAGMA table_info([${TABLE_NAME}])`)) as SQLiteTableInfo
        const isSQLitePK = (pkIndex: number) => pkIndex > 0
        const pks = tableInfo.filter(c => isSQLitePK(c.pk)).map(c => c.name)
        if (_.isEqual(pks.sort(), PK_COLUMNS)) {
          return noMigrationNeeded
        }
      } else {
        const pks = await db
          .raw(
            `SELECT a.attname as name
            FROM   pg_index i
            JOIN   pg_attribute a ON a.attrelid = i.indrelid
                                AND a.attnum = ANY(i.indkey)
            WHERE  i.indrelid = '${TABLE_NAME}'::regclass
            AND    i.indisprimary`
          )
          .then((x: { rows: PostgreSQLTablePK }) => x.rows.map(r => r.name))

        if (_.isEqual(pks.sort(), PK_COLUMNS)) {
          return noMigrationNeeded
        }
      }

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
