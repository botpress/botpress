import Db, { EVENTS_TABLE_NAME, TABLE_NAME } from './db'
import { FLAGGED_MESSAGE_STATUS, FLAG_REASON } from '../types'
import Database from '../../../../packages/bp/src/core/database'

import { createDatabaseSuite } from '../../../../packages/bp/src/core/database/index.tests'
import { PersistedConsoleLogger } from '../../../../packages/bp/src/core/logger'
import { createSpyObject, MockObject } from '../../../../packages/bp/src/core/misc/utils'

const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()

createDatabaseSuite('Misunderstood - DB', (database: Database) => {
  const db = new Db({ database: database.knex, logger })

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

  describe('listEvents', () => {
    const props = {
      botId: 'bot1',
      eventId: '1234',
      language: 'en',
      preview: 'some message',
      reason: FLAG_REASON.action
    }

    it('Returns no events when none in table', async () => {
      const events = await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.new)

      expect(events).toHaveLength(0)
    })

    it('Returns one event if one exists', async () => {
      await db.addEvent(props)

      const events = await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.new)

      expect(events).toHaveLength(1)
    })

    it('Returns many events if many exist', async () => {
      for (let i = 0; i < 3; i++) {
        await db.addEvent(props)
      }

      const events = await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.new)

      expect(events).toHaveLength(3)
    })

    it('Filters - by botId', async () => {
      await db.addEvent({
        ...props,
        botId: 'bot1'
      })
      await db.addEvent({
        ...props,
        botId: 'bot2'
      })
      await db.addEvent({
        ...props,
        botId: 'bot2'
      })

      expect(await db.listEvents('bot1', props.language, FLAGGED_MESSAGE_STATUS.new)).toHaveLength(1)
      expect(await db.listEvents('bot2', props.language, FLAGGED_MESSAGE_STATUS.new)).toHaveLength(2)
      expect(await db.listEvents('bot3', props.language, FLAGGED_MESSAGE_STATUS.new)).toHaveLength(0)
    })

    it('Filters - by language', async () => {
      for (const language of ['en', 'fr', 'fr']) {
        await db.addEvent({
          ...props,
          language
        })
      }

      // Filter by botId
      expect(await db.listEvents(props.botId, 'en', FLAGGED_MESSAGE_STATUS.new)).toHaveLength(1)
      expect(await db.listEvents(props.botId, 'fr', FLAGGED_MESSAGE_STATUS.new)).toHaveLength(2)
      expect(await db.listEvents(props.botId, 'es', FLAGGED_MESSAGE_STATUS.new)).toHaveLength(0)
    })

    it('Filters - by status', async () => {
      await db.addEvent(props)
      await db.addEvent(props)
      await db.addEvent(props)

      const [{ id: id1 }, { id: id2 }, { id: id3 }] = await db.listEvents(
        props.botId,
        props.language,
        FLAGGED_MESSAGE_STATUS.new
      )
      await db.updateStatuses(props.botId, [id1.toString()], FLAGGED_MESSAGE_STATUS.pending)
      await db.updateStatuses(props.botId, [id2.toString()], FLAGGED_MESSAGE_STATUS.pending)
      await db.updateStatuses(props.botId, [id3.toString()], FLAGGED_MESSAGE_STATUS.deleted)

      expect(await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.pending)).toHaveLength(2)
      expect(await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.deleted)).toHaveLength(1)
      expect(await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.new)).toHaveLength(0)
    })

    it('Filters - by reason', async () => {
      for (const reason of [
        FLAG_REASON.thumbs_down,
        FLAG_REASON.thumbs_down,
        FLAG_REASON.auto_hook,
        FLAG_REASON.action,
        FLAG_REASON.manual
      ]) {
        await db.addEvent({
          ...props,
          reason
        })
      }

      for (const { reason, expectedCount } of [
        { reason: FLAG_REASON.thumbs_down, expectedCount: 2 },
        { reason: FLAG_REASON.auto_hook, expectedCount: 3 },
        { reason: FLAG_REASON.action, expectedCount: 3 },
        { reason: FLAG_REASON.manual, expectedCount: 3 }
      ]) {
        expect(
          await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.new, {
            reason
          })
        ).toHaveLength(expectedCount)
      }
    })

    it('Filters - by date', async () => {
      for (const updatedAt of ['2020-09-29T04:00:00Z', '2020-09-29T06:00:00Z', '2020-09-29T08:00:00Z']) {
        await db.knex(TABLE_NAME).insert({
          ...props,
          updatedAt
        })
      }

      for (const { startDate, endDate, expectedCount } of [
        {
          startDate: new Date(Date.UTC(2020, 8, 29, 4, 0, 0)),
          endDate: new Date(Date.UTC(2020, 8, 29, 8, 0, 0)),
          expectedCount: 3
        },
        {
          startDate: new Date(Date.UTC(2020, 8, 29, 8, 0, 1)),
          endDate: new Date(Date.UTC(2020, 8, 29, 8, 0, 2)),
          expectedCount: 0
        },
        {
          startDate: new Date(Date.UTC(2020, 8, 29, 3, 0, 1)),
          endDate: new Date(Date.UTC(2020, 8, 29, 3, 0, 59)),
          expectedCount: 0
        },
        {
          startDate: new Date(Date.UTC(2020, 8, 29, 4, 0, 0)),
          endDate: new Date(Date.UTC(2020, 8, 29, 6, 0, 0)),
          expectedCount: 2
        }
      ]) {
        expect(
          await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.new, {
            startDate,
            endDate
          })
        ).toHaveLength(expectedCount)
      }
    })
  })

  describe('addEvent', () => {
    const props = {
      botId: 'bot1',
      eventId: '1234',
      language: 'en',
      preview: 'some message',
      reason: FLAG_REASON.action
    }

    it('adds unseen events', async () => {
      await db.addEvent(props)
      await db.addEvent(props)
      await db.addEvent(props)

      expect(await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.new)).toHaveLength(3)
    })

    it('does not add seen events', async () => {
      await db.addEvent(props)
      await db.addEvent(props)
      await db.addEvent(props)

      const events = await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.new)
      const lastEvent = events.pop()
      await db.updateStatuses(props.botId, [lastEvent.id.toString()], FLAGGED_MESSAGE_STATUS.deleted)

      // This event should not be added
      await db.addEvent(props)

      expect(await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.new)).toHaveLength(2)
      expect(await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.deleted)).toHaveLength(1)
    })
  })

  describe('deleteAll', () => {
    const mkEvent = async (botId: string, status: FLAGGED_MESSAGE_STATUS) => {
      await db.addEvent({
        botId,
        status,
        eventId: '1234',
        language: 'en',
        preview: (Math.random() + 1).toString(36).substring(2), // Random string
        reason: FLAG_REASON.action
      })
    }

    it('deletes all matching events', async () => {
      const correctBotId = 'some ID'
      const incorrectBotId = 'other ID'
      const correctStatus = FLAGGED_MESSAGE_STATUS.new
      const incorrectStatus = FLAGGED_MESSAGE_STATUS.pending

      await mkEvent(correctBotId, correctStatus)
      await mkEvent(correctBotId, correctStatus)
      await mkEvent(incorrectBotId, correctStatus)
      await mkEvent(correctBotId, incorrectStatus)

      await db.deleteAll(correctBotId, correctStatus)
      expect(await db.listEvents(correctBotId, 'en', correctStatus)).toHaveLength(0)
      expect(await db.listEvents(correctBotId, 'en', incorrectStatus)).toHaveLength(1)
      expect(await db.listEvents(incorrectBotId, 'en', correctStatus)).toHaveLength(1)
    })
  })

  describe('countEvents', () => {
    const mkEvent = async (
      botId: string,
      language: string,
      status: FLAGGED_MESSAGE_STATUS,
      reason = FLAG_REASON.action
    ) => {
      await db.addEvent({
        botId,
        status,
        language,
        reason,
        eventId: '1234',
        preview: (Math.random() + 1).toString(36).substring(2) // Random string
      })
    }

    it('counts events correctly', async () => {
      // async countEvents(botId: string, language: string, options?: FilteringOptions) {
      const botId = 'bot1'
      const lang = 'en'
      await mkEvent(botId, lang, FLAGGED_MESSAGE_STATUS.applied)
      await mkEvent(botId, lang, FLAGGED_MESSAGE_STATUS.deleted)
      await mkEvent(botId, lang, FLAGGED_MESSAGE_STATUS.pending)
      await mkEvent(botId, lang, FLAGGED_MESSAGE_STATUS.new)
      await mkEvent(botId, lang, FLAGGED_MESSAGE_STATUS.new)
      await mkEvent(botId, 'de', FLAGGED_MESSAGE_STATUS.new)

      expect(await db.countEvents(botId, lang)).toStrictEqual({
        applied: 1,
        deleted: 1,
        new: 2,
        pending: 1
      })
    })

    it('counts filtered events correctly', async () => {
      // async countEvents(botId: string, language: string, options?: FilteringOptions) {
      const botId = 'bot1'
      const lang = 'en'
      await mkEvent(botId, lang, FLAGGED_MESSAGE_STATUS.applied, FLAG_REASON.thumbs_down)
      await mkEvent(botId, lang, FLAGGED_MESSAGE_STATUS.deleted, FLAG_REASON.thumbs_down)
      await mkEvent(botId, lang, FLAGGED_MESSAGE_STATUS.pending, FLAG_REASON.thumbs_down)
      await mkEvent(botId, lang, FLAGGED_MESSAGE_STATUS.new, FLAG_REASON.thumbs_down)
      await mkEvent(botId, lang, FLAGGED_MESSAGE_STATUS.new)
      await mkEvent(botId, 'de', FLAGGED_MESSAGE_STATUS.new)

      expect(await db.countEvents(botId, lang, { reason: 'thumbs_down' })).toStrictEqual({
        applied: 1,
        deleted: 1,
        new: 1,
        pending: 1
      })
    })

    it('handles zero events correctly', async () => {
      expect(await db.countEvents('id', 'en')).toStrictEqual({})
    })
  })

  describe('getEventDetails', () => {
    it('handles invalid / non-existent events', async () => {
      expect(await db.getEventDetails('bot', '123')).toBe(undefined)
    })

    it('handles events with no parent events', async () => {
      const botId = 'bot'
      await db.addEvent({
        botId: botId,
        status: FLAGGED_MESSAGE_STATUS.new,
        language: 'en',
        reason: FLAG_REASON.action,
        eventId: '1234',
        preview: 'message text'
      })

      const events = await db.listEvents(botId, 'en', FLAGGED_MESSAGE_STATUS.new)
      expect(events.length).toBe(1)
      const id = events[0].id.toString()
      expect(await db.getEventDetails(botId, id)).toBe(undefined)
    })

    it('handles events with no context messages', async () => {
      const botId = 'bot'
      const language = 'en'
      const eventId = '1234'
      const reason = FLAG_REASON.action
      const status = FLAGGED_MESSAGE_STATUS.new
      const preview = 'some message'

      await db.addEvent({ botId, status, language, eventId, reason, preview })

      const events = await db.listEvents(botId, language, status)
      expect(events.length).toBe(1)
      const id = events[0].id

      // write a basic event straight to the DB
      await database.knex(EVENTS_TABLE_NAME).insert({
        id: '1',
        botId,
        incomingEventId: eventId,
        direction: 'incoming',
        channel: 'some_channel',
        event: JSON.stringify({}),
        createdOn: database.knex.date.now()
      })

      // This check ignores times created and updated
      expect(await db.getEventDetails(botId, id.toString())).toMatchObject({
        botId,
        eventId,
        language,
        preview,
        reason,
        status,
        id,
        nluContexts: [],
        resolution: null,
        resolutionParams: null,
        resolutionType: null,
        context: [{ direction: undefined, isCurrent: true, payloadMessage: undefined, preview: '' }]
      })
    })

    // FIXME:
    /*it('returns full event details', async () => {
      const messages: string[] = [...Array(12)].map((_, i) => `elem_${i.toString().padStart(3, '0')}`)
      const preview = messages[5]
      const botId = 'bot'
      const language = 'en'
      const eventId = '1005'
      const reason = FLAG_REASON.action
      const status = FLAGGED_MESSAGE_STATUS.new

      await db.addEvent({ botId, status, language, eventId, reason, preview })

      const events = await db.listEvents(botId, language, status)
      expect(events.length).toBe(1)
      const id = events[0].id

      // Create surrounding messages
      for (var i = 0; i < messages.length; i++) {
        let m = messages[i]
        await database.knex(EVENTS_TABLE_NAME).insert({
          id: i.toString(),
          botId,
          incomingEventId: (1000 + i).toString(),
          direction: 'incoming',
          channel: 'some_channel',
          event: JSON.stringify({ direction: 'incoming', preview: m, payload: { message: m } }),
          createdOn: new Date().toISOString(),
          threadId: '5',
          sessionId: '7'
        })
      }

      expect(await db.getEventDetails(botId, id.toString())).toMatchObject({
        botId: 'bot',
        context: [...Array(9)].map((_, i) => {
          return {
            direction: 'incoming',
            isCurrent: i === 5,
            payloadMessage: messages[i],
            preview: messages[i]
          }
        }),

        eventId,
        language: 'en',
        nluContexts: [],
        preview: 'elem_005',
        reason: 'action',
        resolution: null,
        resolutionParams: null,
        resolutionType: null,
        status: 'new'
      })
    })*/
  })
})
