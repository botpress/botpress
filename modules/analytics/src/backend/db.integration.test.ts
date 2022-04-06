import Db, { TABLE_NAME } from './db'
import Database from '../../../../packages/bp/src/core/database'

import { createDatabaseSuite } from '../../../../packages/bp/src/core/database/index.tests'
import { PersistedConsoleLogger } from '../../../../packages/bp/src/core/logger'
import { createSpyObject, MockObject } from '../../../../packages/bp/src/core/misc/utils'

const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()

createDatabaseSuite('Analytics - DB', (database: Database) => {
  let db
  beforeAll(async () => {
    db = new Db({ database: database.knex, logger })
    await db.initialize()
    const statement = db.knex.isLite ? 'DELETE FROM' : 'TRUNCATE TABLE'
    await db.knex.raw(`${statement} "${TABLE_NAME}";`)
  })

  afterAll(() => {
    db.destroy()
  })

  beforeEach(async () => {
    await db.knex.raw(db.knex.isLite ? 'BEGIN TRANSACTION' : 'START TRANSACTION')
  })

  afterEach(async () => {
    await db.knex.raw(db.knex.isLite ? 'ROLLBACK TRANSACTION' : 'ROLLBACK')
  })

  describe('getMetrics', () => {
    it('Returns no metrics when table is empty', async () => {
      const metrics = await db.getMetrics('botName', {
        startDate: new Date(0),
        endDate: new Date(),
        channel: 'all'
      })

      expect(metrics).toHaveLength(0)
    })
  })
})
