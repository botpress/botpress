import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/services/migration'
import Database from 'core/database'

const TABLE_NAME = 'srv_logs'
const COLUMN_NAME = 'timestamp'
const CURRENT_DATE_FORMAT = 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'

const migration: Migration = {
  info: {
    description: '',
    type: 'config'
  },
  up: async ({ database }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const { client } = database.knex.client.config
    if (client === 'sqlite3') {
      return migrateSqlite3(database)
    }
    return migratePostgresql(database)
  }
}

// No actual data change for sqlite as it does not store dates but only string
// See: https://www.sqlite.org/draft/datatype3.html
// Only change the actual column type to be consistant
async function migrateSqlite3(db: Database): Promise<sdk.MigrationResult> {
  const tempName = COLUMN_NAME + '_temp'
  try {
    await db.knex.schema.alterTable(TABLE_NAME, table => {
      table.renameColumn(COLUMN_NAME, tempName)
    })

    await db.knex.schema.alterTable(TABLE_NAME, table => {
      table.timestamp(COLUMN_NAME)
    })

    await db.knex(TABLE_NAME).update({
      [COLUMN_NAME]: db.knex.raw('??', [tempName])
    })
  } catch (err) {
    // delete new column
    await db.knex.schema.alterTable(TABLE_NAME, table => {
      table.dropColumn(COLUMN_NAME)
    })

    // rename temp to original name
    await db.knex.schema.alterTable(TABLE_NAME, table => {
      table.renameColumn(tempName, COLUMN_NAME)
    })
    return { success: false, message: err }
  }

  // delete temp
  await db.knex.schema.alterTable(TABLE_NAME, table => {
    table.dropColumn(tempName)
  })
  return { success: true, message: 'SQLite Database updated successfully' }
}

async function migratePostgresql(db: Database): Promise<sdk.MigrationResult> {
  try {
    await db.knex.raw(
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

export default migration
