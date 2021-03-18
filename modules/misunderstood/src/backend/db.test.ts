import Db from './db'
// import * as sdk from 'botpress/sdk'
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

import { PersistedConsoleLogger } from '../../../../src/bp/core/logger'
import { createSpyObject, MockObject } from '../../../../src/bp/core/misc/utils'
import { createDatabaseSuite } from '../../../../src/bp/core/database/index.tests'

createDatabaseSuite('Misunderstood', (database: Database) => {
  const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()

  describe('Get', () => {
    it("Returns undefined if key doesn't exist", async () => {
      const db = new Db({ database: database.knex })
      await db.initialize()
      await db.listEvents('', '', FLAGGED_MESSAGE_STATUS.new)
    })
  })
})
