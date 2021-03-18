import Db, { TABLE_NAME } from './db'
import {
  DbFlaggedEvent,
  FilteringOptions,
  FlaggedEvent,
  FLAGGED_MESSAGE_STATUS,
  FLAGGED_MESSAGE_STATUSES,
  FLAG_REASON,
  ResolutionData,
  RESOLUTION_TYPE
} from '../types'
import 'reflect-metadata'
import Database from '../../../../src/bp/core/database'

import { createDatabaseSuite } from '../../../../src/bp/core/database/index.tests'

createDatabaseSuite('Misunderstood', (database: Database) => {
  const db = new Db({ database: database.knex })
  beforeAll(async () => {
    db.knex = database.knex
    await db.initialize()
  })

  afterEach(async () => {
    if (!db.knex.isLite) {
      await db.knex.raw(`TRUNCATE TABLE "${TABLE_NAME}";`)
    }
  })

  describe('Get', () => {
    it("Returns undefined if key doesn't exist", async () => {
      const botId = 'mybot'
      const eventId = '1234'
      const language = 'en'
      await db.addEvent({ botId, eventId, language, preview: 'some message', reason: FLAG_REASON.action })

      const events = await db.listEvents(botId, language, FLAGGED_MESSAGE_STATUS.new)
      expect(events).toHaveLength(1)
    })
  })
})
