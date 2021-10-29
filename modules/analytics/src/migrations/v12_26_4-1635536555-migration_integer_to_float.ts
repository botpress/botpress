import * as sdk from 'botpress/sdk'
import Knex from 'knex'

const TABLE_NAME = 'bot_analytics'
const TEMP_TABLE_NAME = `${TABLE_NAME}_tmp`
const COLUMN = 'value'

const migrateLite = async (db: sdk.KnexExtended, trx: Knex.Transaction, isUp: boolean) => {
  //  1- create a temp table with the correct preview column type
  await db.schema.transacting(trx).dropTableIfExists(TEMP_TABLE_NAME)
  await db.schema.transacting(trx).createTable(TEMP_TABLE_NAME, table => {
    table.increments('id')
    table.string('botId')
    table.date('date')
    table.string('channel')
    isUp ? table.float('value') : table.integer('value')
    table.string('metric')
    table.string('subMetric')
  })

  //  2- move all data from original table to that table
  await trx.raw(`INSERT INTO ${TEMP_TABLE_NAME} SELECT * FROM ${TABLE_NAME}`)
  //  3- drop old table
  await db.schema.transacting(trx).dropTable(TABLE_NAME)
  //  4- rename temp table to original table name
  await db.schema.transacting(trx).renameTable(TEMP_TABLE_NAME, TABLE_NAME)
}

const migratePG = async (db: sdk.KnexExtended, isUp: boolean) => {
  const query = `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${COLUMN} TYPE ${isUp ? 'float' : 'integer'};`
  return db.raw(query)
}

const migrate = async (bp, database, isUp): Promise<sdk.MigrationResult> => {
  const db = database.knex as sdk.KnexExtended
  if (!(await db.schema.hasTable(TABLE_NAME))) {
    return { success: true, message: 'Migration skipped' }
  }
  try {
    if (bp.database.isLite) {
      await db.transaction(async trx => migrateLite(db, trx, isUp))
    } else {
      await migratePG(db, isUp)
    }
    return { success: true, message: `Successfully altered ${COLUMN} column to ${isUp ? 'float' : 'integer'}` }
  } catch (error) {
    bp.logger
      .attachError(error)
      .error(`Could not alter ${COLUMN} column on ${TABLE_NAME} to ${isUp ? 'float' : 'integer'}`)
    return { success: false, message: error.message }
  }
}

const migration: sdk.ModuleMigration = {
  info: {
    description: `Switches ${COLUMN} column from integer to float to save intent confidences`,
    type: 'database',
    target: 'bot'
  },
  up: async ({ bp, database }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    return migrate(bp, database, true)
  },
  down: async ({ bp, database }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    return migrate(bp, database, false)
  }
}

export default migration
