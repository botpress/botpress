import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'alter kvs table primary key for a union of both column key and column botId',
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
    const tableName = 'srv_kvs'
    const tempName = 'srv_kvs_temp'

    const noMigrationNeeded = { success: true, message: 'No need for migration' }
    const { client } = database.knex.client.config
    if (client === 'sqlite3') {
      const tableInfo = await database.knex.raw(`PRAGMA table_info([${tableName}])`).then(x => x)
      const numberOfPK = tableInfo.map(column => column.pk).filter(x => !!x).length
      if (numberOfPK > 1) {
        return noMigrationNeeded
      }
    } else {
      const pks = await database.knex
        .raw(
          `SELECT a.attname as name
            FROM   pg_index i
            JOIN   pg_attribute a ON a.attrelid = i.indrelid
                                AND a.attnum = ANY(i.indkey)
            WHERE  i.indrelid = '${tableName}'::regclass
            AND    i.indisprimary`
        )
        .then(x => x.rows.map(r => r.name))
      if (pks.length > 1) {
        return noMigrationNeeded
      }
    }

    let errorStatus
    await database.knex
      .transaction(async trx => {
        await database.knex.schema.transacting(trx).createTable(tempName, table => {
          table.string('key')
          table.text('value').notNullable()
          table.string('botId').notNullable()
          table.timestamp('modified_on')
          table.primary(['key', 'botId'])
        })
        const rows = await database.knex
          .transacting(trx)
          .select()
          .from(tableName)
        if (rows.length) {
          await database.knex
            .transacting(trx)
            .table(tempName)
            .insert(rows)
        }
        await database.knex.schema.transacting(trx).dropTable(tableName)
        await database.knex.schema.transacting(trx).renameTable(tempName, tableName)
      })
      .catch(err => {
        errorStatus = err
      })

    if (errorStatus) {
      return { success: false, message: errorStatus }
    }

    return { success: true, message: 'Database updated successfully' }
  }
}

export default migration
