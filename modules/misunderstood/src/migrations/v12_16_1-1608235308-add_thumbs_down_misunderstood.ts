import * as sdk from 'botpress/sdk'
import Knex from 'knex'

import { FLAGGED_MESSAGE_STATUS, FLAGGED_MESSAGE_STATUSES, FLAG_REASON, RESOLUTION_TYPE } from '../types'

const TEMP_TABLE_NAME = 'misunderstood_tmp'
const TABLE_NAME = 'misunderstood'
const COLUMN = 'reason'

const migrateLite = async (db: sdk.KnexExtended, trx: Knex.Transaction) => {
  //  1- create a temp table with same schema and good constraint
  const hastmp = await db.schema.transacting(trx).hasTable(TEMP_TABLE_NAME)
  if (hastmp) {
    await trx.raw(`TRUNCATE TABLE ${TEMP_TABLE_NAME}`)
  } else {
    await db.schema.transacting(trx).createTable(TEMP_TABLE_NAME, table => {
      table.increments('id')
      table.string('eventId')
      table.string('botId')
      table.string('language')
      table.string('preview')
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
  const constraintName = `${TABLE_NAME}_${COLUMN}_check`
  const constraintValues: string = Object.values(FLAG_REASON)
    .map(r => `'${r}'::text`)
    .join(', ')

  const query = `
  ALTER TABLE ${TABLE_NAME} DROP CONSTRAINT IF EXISTS ${constraintName};
  ALTER TABLE ${TABLE_NAME} ADD CONSTRAINT ${constraintName} CHECK (${COLUMN} = ANY (ARRAY[${constraintValues}]));
  `

  return db.raw(query)
}

const migration: sdk.ModuleMigration = {
  info: {
    description: `Adds thumbs down as reason on ${TABLE_NAME}`,
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

      return { success: true, message: `Constraint on ${COLUMN} of ${TABLE_NAME} altered` }
    } catch (error) {
      bp.logger.attachError(error).error(`Could not alter constraint on ${COLUMN} of ${TABLE_NAME}`)
      return { success: false, message: error.message }
    }
  }
}

export default migration
