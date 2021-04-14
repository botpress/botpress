import * as sdk from 'botpress/sdk'
import Database from 'core/database'
import { Migration, MigrationOpts } from 'core/migration'

const TABLE_NAME = 'srv_logs'
const COLUMN_NAME = 'timestamp'
const CURRENT_DATE_FORMAT = 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'

const PG_VARCHAR_TYPE = 'character varying'
const SQLITE_TIMESTAMP_TYPE = 'datetime'

const migration: Migration = {
  info: {
    description: 'Changes the type of the column timestamp of table logs to the correct one',
    type: 'config'
  },
  up: async ({ database, bp }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const columnInfo = await database.knex(TABLE_NAME).columnInfo(COLUMN_NAME)
    const noMigrationNeeded = { success: true, message: 'No migration needed' }

    const { client } = database.knex.client.config
    if (client === 'sqlite3') {
      if (columnInfo.type === SQLITE_TIMESTAMP_TYPE) {
        return noMigrationNeeded
      }

      bp.logger.warn('It may take some time if you have a lot of logs in your database')
      return migrateSqlite3(database)
    }

    if (columnInfo.type !== PG_VARCHAR_TYPE) {
      return noMigrationNeeded
    }
    return migratePostgresql(database)
  }
}

// No actual data change for sqlite as it does not store dates but only string
// See: https://www.sqlite.org/draft/datatype3.html
// Only change the actual column type to be consistant
async function migrateSqlite3(db: Database): Promise<sdk.MigrationResult> {
  const tempName = COLUMN_NAME + '_temp'
  let errorStatus
  await db.knex.transaction(trx => {
    return db.knex.schema
      .transacting(trx)
      .alterTable(TABLE_NAME, table => {
        table.renameColumn(COLUMN_NAME, tempName)
      })
      .then(() => {
        return db.knex.schema.transacting(trx).alterTable(TABLE_NAME, table => {
          table.timestamp(COLUMN_NAME)
        })
      })
      .then(() => {
        return db
          .knex(TABLE_NAME)
          .transacting(trx)
          .update({
            [COLUMN_NAME]: db.knex.raw('??', [tempName])
          })
      })
      .then(() => {
        return db.knex.schema.transacting(trx).alterTable(TABLE_NAME, table => {
          table.dropColumn(tempName)
        })
      })
      .then(trx.commit)
      .catch(async err => {
        await trx.rollback()
        errorStatus = err
      })
  })

  if (errorStatus) {
    return { success: false, message: errorStatus }
  }
  return { success: true, message: 'SQLite Database updated successfully' }
}

async function migratePostgresql(db: Database): Promise<sdk.MigrationResult> {
  try {
    await db.knex.raw(
      `
      ALTER TABLE ${TABLE_NAME}
      ALTER COLUMN ${COLUMN_NAME} TYPE TIMESTAMP WITH TIME ZONE USING TO_TIMESTAMP(${COLUMN_NAME}, '${CURRENT_DATE_FORMAT}');
      `
    )
  } catch (err) {
    return { success: false, message: err }
  }
  return { success: true, message: 'PostgreSQL Database updated successfully' }
}

export default migration
