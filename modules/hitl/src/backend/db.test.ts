import Db, { TABLE_NAME_SESSIONS, TABLE_NAME_MESSAGES } from './db'
import Database from '../../../../packages/bp/src/core/database'

import { createDatabaseSuite } from '../../../../packages/bp/src/core/database/index.tests'
import { PersistedConsoleLogger } from '../../../../packages/bp/src/core/logger'
import { createSpyObject, MockObject } from '../../../../packages/bp/src/core/misc/utils'

const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()

createDatabaseSuite('Misunderstood - DB', (database: Database) => {
  let db
  beforeAll(async () => {
    db = new Db({ database: database.knex, logger })
    await db.initialize()
    // We can't truncate tables here because of foreign key references, so tests may
    // have to deal with existing data. Ideally move to either an in memory DB for testing
    // or wrap this in infrastructure to spin up a clean DB every time.
  })

  beforeEach(async () => {
    await db.knex.raw(db.knex.isLite ? 'BEGIN TRANSACTION' : 'START TRANSACTION')
  })

  afterEach(async () => {
    await db.knex.raw(db.knex.isLite ? 'ROLLBACK TRANSACTION' : 'ROLLBACK')
  })

  describe('Sessions - DB', () => {
    it('Returns no session when table is empty', async () => {
      const session = await db.getSessionById('2147483647')
      expect(session).toEqual(undefined)
    })
  })
})
