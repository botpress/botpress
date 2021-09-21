import * as sdk from 'botpress/sdk'

import Db, { TABLE_NAME } from './db'
import { FLAGGED_MESSAGE_STATUS, FLAG_REASON, RESOLUTION_TYPE } from '../types'

import { makeMockGhost } from './mockGhost'

import Database from '../../../../packages/bp/src/core/database'
import { createDatabaseSuite } from '../../../../packages/bp/src/core/database/index.tests'
import { PersistedConsoleLogger } from '../../../../packages/bp/src/core/logger'
import { createSpyObject, MockObject } from '../../../../packages/bp/src/core/misc/utils'

const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()

createDatabaseSuite('Misunderstood - import / export', (database: Database) => {
  const db = new Db({ database: database.knex, logger, ghost: { forBot: (_: string) => makeMockGhost() } })

  beforeAll(async () => {
    db.knex = database.knex
    await db.initialize()
    const statement = db.knex.isLite ? 'DELETE FROM' : 'TRUNCATE TABLE'
    await db.knex.raw(`${statement} "${TABLE_NAME}";`)
  })

  beforeEach(async () => {
    await db.knex.raw(db.knex.isLite ? 'BEGIN TRANSACTION' : 'START TRANSACTION')
  })

  afterEach(async () => {
    await db.knex.raw(db.knex.isLite ? 'ROLLBACK TRANSACTION' : 'ROLLBACK')
  })
  describe('importData', () => {
    it('works with empty data', async () => {
      const data = await db.importData('bot', [])
      expect(data).toBe(undefined)
    })

    it('correctly ignores events with undefined or null resolutions', async () => {
      // save mockGhost in the closure so we can access the jest mock functions in
      // the test, and inject a function to return a mock ghost instance into db
      let mockGhost: sdk.ScopedGhostService
      db.ghostForBot = (_: string): sdk.ScopedGhostService => {
        mockGhost = makeMockGhost({
          intents: { file: { utterances: { en: ['hi!', 'hello'] } } }
        })
        return mockGhost
      }

      const data = await db.importData('bot', [
        {
          botId: 'bot',
          reason: FLAG_REASON.auto_hook,
          language: 'en',
          resolution: undefined,
          resolutionType: undefined,
          status: FLAGGED_MESSAGE_STATUS.applied,
          eventId: '1',
          preview: 'skip me'
        },
        {
          botId: 'bot',
          reason: FLAG_REASON.auto_hook,
          language: 'en',
          resolution: 'test-intent',
          resolutionType: undefined,
          status: FLAGGED_MESSAGE_STATUS.applied,
          eventId: '2',
          preview: 'skip me'
        },
        {
          botId: 'bot',
          reason: FLAG_REASON.auto_hook,
          language: 'en',
          resolution: undefined,
          resolutionType: RESOLUTION_TYPE.intent,
          status: FLAGGED_MESSAGE_STATUS.applied,
          eventId: '3',
          preview: 'skip me'
        }
      ])
      expect(data).toBe(undefined)
      expect(mockGhost.upsertFile).not.toHaveBeenCalled()
      expect(mockGhost.directoryListing).not.toHaveBeenCalled()
      expect(mockGhost.readFileAsObject).not.toHaveBeenCalled()
    })

    it("correctly errors if qna or intent don't exist", async () => {
      let mockGhost: sdk.ScopedGhostService
      db.ghostForBot = (_: string): sdk.ScopedGhostService => {
        mockGhost = makeMockGhost({
          intents: { file: { utterances: { en: ['hi!', 'hello'] } } }
        })
        return mockGhost
      }

      const res = "this intent doesn't exist"
      const f = async () =>
        await db.importData('bot', [
          {
            botId: 'bot',
            reason: FLAG_REASON.auto_hook,
            language: 'en',
            resolution: res,
            resolutionType: RESOLUTION_TYPE.intent,
            status: FLAGGED_MESSAGE_STATUS.applied,
            eventId: '2',
            preview: 'I should throw an error'
          }
        ])

      expect(f()).rejects.toThrow(res)
      expect(mockGhost.upsertFile).not.toHaveBeenCalled()
      expect(mockGhost.readFileAsObject).not.toHaveBeenCalled()
    })

    it('correctly imports data if all intents / qnas exist', async () => {
      let mockGhost: sdk.ScopedGhostService
      db.ghostForBot = (_: string): sdk.ScopedGhostService => {
        mockGhost = makeMockGhost({
          intents: {
            'int1.json': { utterances: { en: ['hi!', 'hello'] } },
            'int2.json': { utterances: { en: ['bye', 'goodbye', 'l8r sk8r'] } },
            'int3.json': { utterances: { en: ['your mother was a hamster', 'your father smelt of elderberries'] } }
          }
        })
        return mockGhost
      }

      const data = await db.importData('bot', [
        {
          botId: 'bot',
          reason: FLAG_REASON.auto_hook,
          language: 'en',
          resolution: 'int1',
          resolutionType: RESOLUTION_TYPE.intent,
          status: FLAGGED_MESSAGE_STATUS.applied,
          eventId: '1',
          preview: 'msg1'
        },
        {
          botId: 'bot',
          reason: FLAG_REASON.auto_hook,
          language: 'en',
          resolution: 'int2',
          resolutionType: RESOLUTION_TYPE.intent,
          status: FLAGGED_MESSAGE_STATUS.applied,
          eventId: '2',
          preview: 'msg2'
        },
        {
          botId: 'bot',
          reason: FLAG_REASON.auto_hook,
          language: 'en',
          resolution: 'int3',
          resolutionType: RESOLUTION_TYPE.intent,
          status: FLAGGED_MESSAGE_STATUS.applied,
          eventId: '3',
          preview: 'msg3'
        }
      ])
      expect(data).toBe(undefined)
      expect(mockGhost.upsertFile).toHaveBeenCalledTimes(9)
      expect(mockGhost.upsertFile).toHaveBeenNthCalledWith(
        3,
        'intents',
        'int1.json',
        JSON.stringify({ utterances: { en: ['hi!', 'hello', 'msg1'] } }, null, 2)
      )
      expect(mockGhost.upsertFile).toHaveBeenNthCalledWith(
        6,
        'intents',
        'int2.json',
        JSON.stringify({ utterances: { en: ['bye', 'goodbye', 'l8r sk8r', 'msg2'] } }, null, 2)
      )
      expect(mockGhost.upsertFile).toHaveBeenNthCalledWith(
        9,
        'intents',
        'int3.json',
        JSON.stringify(
          { utterances: { en: ['your mother was a hamster', 'your father smelt of elderberries', 'msg3'] } },
          null,
          2
        )
      )
    })
  })

  describe('exportProcessedData', () => {
    it('works with no data', async () => {
      const data = await db.exportProcessedData("this bot doesn't exist")
      expect(data).toHaveLength(0)
    })
    it("exports only data that's been applied", async () => {
      const preview = 'message'
      const botId = 'bot'
      const language = 'en'
      const resolutionType = RESOLUTION_TYPE.intent
      const resolution = 'test-intent'
      const reason = FLAG_REASON.auto_hook

      // This data should return
      for (let i = 0; i < 10; i++) {
        await db.addEvent({
          botId,
          reason,
          language,
          resolution,
          resolutionType,
          status: FLAGGED_MESSAGE_STATUS.applied,
          eventId: i.toString(),
          preview: `${preview}_${i.toString().padStart(3, '0')}`
        })
      }

      // Wrong status, shouldn't return
      for (let i = 10; i < 15; i++) {
        await db.addEvent({
          botId,
          reason,
          language,
          status: FLAGGED_MESSAGE_STATUS.new,
          eventId: i.toString(),
          preview: `${preview}_${i.toString().padStart(3, '0')}`
        })
      }

      // Wrong botId, shouldn't return
      for (let i = 15; i < 20; i++) {
        await db.addEvent({
          botId: `not_${botId}`,
          reason,
          language,
          status: FLAGGED_MESSAGE_STATUS.applied,
          eventId: i.toString(),
          preview: `${preview}_${i.toString().padStart(3, '0')}`
        })
      }
      const data = await db.exportProcessedData(botId)
      expect(data).toHaveLength(10)
      for (let i = 0; i < 10; i++) {
        expect(data[i]).toMatchObject({
          botId,
          reason,
          language,
          resolution,
          resolutionType,
          status: FLAGGED_MESSAGE_STATUS.applied,
          eventId: i.toString(),
          preview: `${preview}_${i.toString().padStart(3, '0')}`
        })
      }
    })
  })
})
