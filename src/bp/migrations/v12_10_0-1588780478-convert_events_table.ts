import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'
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
      return { success: true, message: 'Table is already migrated' }
    } else {
      const tempTableExists = await bp.database.schema.hasTable(TEMP_TABLE_NAME)
      if (tempTableExists) {
        return { success: false, message: `Temporary table already exists - remove it (${TEMP_TABLE_NAME})` }
      }
    }

    const tableFields = [
      'botId',
      'channel',
      'threadId',
      'target',
      'sessionId',
      'direction',
      'incomingEventId',
      'workflowId',
      'feedback',
      'success',
      'event',
      'createdOn'
    ]

    try {
      await db.transaction(async trx => {
        await db.schema.transacting(trx).createTable(TEMP_TABLE_NAME, table => {
          table.string('id').primary()
          table.string('botId').notNullable()
          table.string('channel').notNullable()
          table.string('threadId').nullable()
          table.string('target').nullable()
          table.string('sessionId').nullable()
          table.string('direction').notNullable()
          table.string('incomingEventId').nullable()
          table.string('workflowId').nullable()
          table.integer('feedback').nullable()
          table.boolean('success').nullable()
          table.json('event').notNullable()
          table.timestamp('createdOn').notNullable()
        })

        const rows = await db<sdk.IO.StoredEvent>(TABLE_NAME)
          .select('*')
          .transacting(trx)
          .then(rows =>
            rows
              .map(row => ({
                ..._.pick(row, tableFields),
                id: db.json.get(row.event)?.id
              }))
              .filter(x => x.id)
          )

        // There should be no duplicates, but just in case.
        const uniqueRows = _.uniqBy(rows, x => x.id)

        if (uniqueRows.length) {
          await db.batchInsert(TEMP_TABLE_NAME, uniqueRows, 30).transacting(trx)
        }

        await database.knex.schema.transacting(trx).dropTable(TABLE_NAME)
        await database.knex.schema.transacting(trx).renameTable(TEMP_TABLE_NAME, TABLE_NAME)
      })
    } catch (err) {
      bp.logger.attachError(err).error(`Could not fix events table`)
      return { success: false, message: 'Configuration updated successfully' }
    }

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
