import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'

const TABLE_NAME = 'srv_migrations'

const migrateSrvMigration = async (bp: typeof sdk, db: sdk.KnexExtended) => {
  if (db.isLite) {
    bp.logger.info('No length constraint on sqlite varchar')
    return
  }
  return db.schema.alterTable(TABLE_NAME, table => table.text('details').alter())
}

const migration: Migration = {
  info: {
    description: `Alter details column of ${TABLE_NAME} from varchar(255) to text`,
    type: 'database'
  },
  up: async ({ bp, database }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    await migrateSrvMigration(bp, database.knex)
    return { success: true, message: 'Migration details column has been altered successfully' }
  }
}

export default migration
