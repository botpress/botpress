import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'
import _ from 'lodash'

const TABLE_NAME = 'events'
const TEMP_TABLE_NAME = 'events_temp'

const migration: Migration = {
  info: {
    description: 'Migrate events table (may take some time)',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp, database }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const db = database.knex as sdk.KnexExtended

    const { client } = db.client.config
    let columnType

    if (client === 'sqlite3') {
      const tableInfo = await db.raw(`PRAGMA table_info([${TABLE_NAME}])`)
      columnType = tableInfo[0].type
    } else {
      const query = await db('information_schema.columns')
        .select('data_type')
        .where({ table_name: TABLE_NAME, column_name: 'id' })
        .first()

      columnType = query.data_type
    }

    if (columnType !== 'integer') {
      // Handle a case for developers where a previous migration marked v13.0.0 converts the table, but didn't add the type
      if (!(await bp.database.schema.hasColumn(TABLE_NAME, 'type'))) {
        await bp.database.schema.alterTable(TABLE_NAME, table => {
          table.string('type').nullable()
        })

        return { success: true, message: 'Added column type to events table' }
      }

      return { success: true, message: 'Table is already migrated' }
    } else {
      const tempTableExists = await bp.database.schema.hasTable(TEMP_TABLE_NAME)
      if (tempTableExists) {
        return { success: false, message: `Temporary table already exists - remove it (${TEMP_TABLE_NAME})` }
      }
    }

    const tableFields = [
      'id',
      'botId',
      'channel',
      'threadId',
      'target',
      'sessionId',
      'type',
      'direction',
      'incomingEventId',
      'workflowId',
      'feedback',
      'success',
      'event',
      'createdOn'
    ]
      .map(x => `"${x}"`)
      .join(',')

    try {
      await db.transaction(async trx => {
        await db.schema.transacting(trx).createTable(TEMP_TABLE_NAME, table => {
          table.string('id').primary()
          table.string('botId').notNullable()
          table.string('channel').notNullable()
          table.string('threadId').nullable()
          table.string('target').nullable()
          table.string('sessionId').nullable()
          table.string('type').nullable()
          table.string('direction').notNullable()
          table.string('incomingEventId').nullable()
          table.string('workflowId').nullable()
          table.integer('feedback').nullable()
          table.boolean('success').nullable()
          table.json('event').notNullable()
          table.timestamp('createdOn').notNullable()
          table.index('createdOn', 'events_idx')
        })

        if (db.isLite) {
          await trx.raw(`
          INSERT OR IGNORE INTO
            ${TEMP_TABLE_NAME} (${tableFields})
          SELECT
            json_extract(event, '$.id') as id, "botId", channel, "threadId", target, "sessionId", json_extract(event, '$.type') as type,
            direction, "incomingEventId", "workflowId", feedback, success, event, "createdOn"
          FROM ${TABLE_NAME}`)
        } else {
          await trx.raw(`
            INSERT INTO
              ${TEMP_TABLE_NAME} (${tableFields})
            SELECT
              event::json->>'id' as id, "botId", channel, "threadId", target, "sessionId", event::json->>'type' as type,
              direction, "incomingEventId", "workflowId", feedback, success, event, "createdOn"
            FROM ${TABLE_NAME}
            ON CONFLICT (id)
            DO NOTHING`)
        }

        await database.knex.schema.transacting(trx).dropTable(TABLE_NAME)
        await database.knex.schema.transacting(trx).renameTable(TEMP_TABLE_NAME, TABLE_NAME)
      })
    } catch (err) {
      bp.logger.attachError(err).error('Could not fix events table')
      return { success: false, message: 'Could not fix events table' }
    }

    return { success: true, message: 'Table events updated successfully' }
  }
}

export default migration
