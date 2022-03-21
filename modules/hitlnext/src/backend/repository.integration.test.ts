;(global as any).DEBUG = () => () => {}

import Repository from './repository'
import Database from '../../../../packages/bp/src/core/database'

import { createDatabaseSuite } from '../../../../packages/bp/src/core/database/index.tests'
import { PersistedConsoleLogger } from '../../../../packages/bp/src/core/logger'
import { createSpyObject, MockObject } from '../../../../packages/bp/src/core/misc/utils'

import migrate from './migrate'

const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()

createDatabaseSuite('HITLNext - Repository', (database: Database) => {
  let repo: Repository
  beforeAll(async () => {
    repo = new Repository({ database: database.knex, logger }, {})
    await migrate({ database: database.knex })
  })

  beforeEach(async () => {
    await database.knex.raw(database.knex.isLite ? 'BEGIN TRANSACTION' : 'START TRANSACTION')
  })

  afterEach(async () => {
    await database.knex.raw(database.knex.isLite ? 'ROLLBACK TRANSACTION' : 'ROLLBACK')
  })

  describe('getHandoffs', () => {
    it('Returns no handoffs when table is empty', async () => {
      const handoff = await repo.getHandoff('123456')
      expect(handoff?.fulfillmentValue).toBe(undefined)
    })
  })
})
