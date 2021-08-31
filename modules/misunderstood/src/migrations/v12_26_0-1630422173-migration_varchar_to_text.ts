import * as sdk from 'botpress/sdk'
import Knex from 'knex'

import { FLAGGED_MESSAGE_STATUS, FLAGGED_MESSAGE_STATUSES, FLAG_REASON, RESOLUTION_TYPE } from '../types'

const TABLE_NAME = 'misunderstood'
const TEMP_TABLE_NAME = `${TABLE_NAME}_tmp`
const COLUMN = 'preview'

const migrateLite = async (db: sdk.KnexExtended, trx: Knex.Transaction) => {
  //  1- create a temp table with the correct preview column type
  const hastmp = await db.schema.transacting(trx).hasTable(TEMP_TABLE_NAME)
  if (hastmp) {
    await trx.raw(`TRUNCATE TABLE ${TEMP_TABLE_NAME}`)
  } else {
    await db.schema.transacting(trx).createTable(TEMP_TABLE_NAME, table => {
      table.increments('id')
      table.string('eventId')
      table.string('botId')
      table.string('language')
      table.text('preview')
      table.enum('reason', Object.values(FLAG_REASON))
      table.enum('status', FLAGGED_MESSAGE_STATUSES).defaultTo(FLAGGED_MESSAGE_STATUS.new)
      table.enum('resolutionType', Object.values(RESOLUTION_TYPE))
      table.string('resolution')
      table.json('resolutionParams')
      table.timestamp('createdAt').defaultTo(db.fn.now())
      table.timestamp('updatedAt').defaultTo(db.fn.now())
    })
  }

  //  2- move all data from original table to that table
  await trx.raw(`INSERT INTO ${TEMP_TABLE_NAME} SELECT * FROM ${TABLE_NAME}`)
  //  3- drop old table
  await db.schema.transacting(trx).dropTable(TABLE_NAME)
  //  4- rename temp table to original table name
  await db.schema.transacting(trx).renameTable(TEMP_TABLE_NAME, TABLE_NAME)
}

const migratePG = async (db: sdk.KnexExtended) => {
  const query = `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${COLUMN} TYPE text;`
  return db.raw(query)
}

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Switches preview column from varchar to text to remove message length limit',
    type: 'database'
  },
  up: async ({ bp, database }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const db = database.knex as sdk.KnexExtended
    try {
      if (bp.database.isLite) {
        await db.transaction(async trx => migrateLite(db, trx))
      } else {
        await migratePG(db)
      }
      return { success: true, message: 'Successfully altered preview column to text' }
    } catch (error) {
      bp.logger.attachError(error).error(`Could not alter ${COLUMN} column on ${TABLE_NAME} to text type`)
      return { success: false, message: error.message }
    }
  }
}

export default migration
