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

createDatabaseSuite('Misunderstood - DB', (database: Database) => {
  const db = new Db({ database: database.knex })

  beforeAll(async () => {
    db.knex = database.knex
    await db.initialize()
    const statement = db.knex.isLite ? 'DELETE FROM' : 'TRUNCATE TABLE'
    await db.knex.raw(`${statement} "${TABLE_NAME}";`)
  })

  afterEach(async () => {
    const statement = db.knex.isLite ? 'DELETE FROM' : 'TRUNCATE TABLE'
    await db.knex.raw(`${statement} "${TABLE_NAME}";`)
  })

  describe('listEvents', () => {
    it('Returns no events when none in table', async () => {
      const botId = 'mybot'
      const eventId = '1234'
      const language = 'en'

      const events = await db.listEvents(botId, language, FLAGGED_MESSAGE_STATUS.new)
      expect(events).toHaveLength(0)
    })

    it('Returns one event if one exists', async () => {
      const botId = 'mybot'
      const eventId = '1234'
      const language = 'en'
      await db.addEvent({ botId, eventId, language, preview: 'some message', reason: FLAG_REASON.action })

      const events = await db.listEvents(botId, language, FLAGGED_MESSAGE_STATUS.new)
      expect(events).toHaveLength(1)
    })

    it('Returns many events if many exist', async () => {
      const botId = 'mybot'
      const eventId = '1234'
      const language = 'en'
      await db.addEvent({ botId, eventId, language, preview: 'some message', reason: FLAG_REASON.action })
      await db.addEvent({ botId, eventId, language, preview: 'some message', reason: FLAG_REASON.action })
      await db.addEvent({ botId, eventId, language, preview: 'some message', reason: FLAG_REASON.action })

      const events = await db.listEvents(botId, language, FLAGGED_MESSAGE_STATUS.new)
      expect(events).toHaveLength(3)
    })

    it('Filters - by botId', async () => {
      const props = {
        botId: 'bot1',
        eventId: '1234',
        language: 'en',
        preview: 'some message',
        reason: FLAG_REASON.action
      }

      await db.addEvent({
        ...props,
        botId: 'bot1'
      })
      await db.addEvent({
        ...props,
        botId: 'bot2'
      })

      // Filter by botId
      expect(await db.listEvents('bot1', 'en', FLAGGED_MESSAGE_STATUS.new)).toHaveLength(1)
      expect(await db.listEvents('bot2', 'en', FLAGGED_MESSAGE_STATUS.new)).toHaveLength(1)
      expect(await db.listEvents('bot3', 'en', FLAGGED_MESSAGE_STATUS.new)).toHaveLength(0)
    })

    it('Filters - by language', async () => {
      const props = {
        botId: 'bot1',
        eventId: '1234',
        language: 'en',
        preview: 'some message',
        reason: FLAG_REASON.action
      }

      await db.addEvent({
        ...props,
        language: 'en'
      })
      await db.addEvent({
        ...props,
        language: 'fr'
      })
      await db.addEvent({
        ...props,
        language: 'fr'
      })

      // Filter by botId
      expect(await db.listEvents(props.botId, 'en', FLAGGED_MESSAGE_STATUS.new)).toHaveLength(1)
      expect(await db.listEvents(props.botId, 'fr', FLAGGED_MESSAGE_STATUS.new)).toHaveLength(2)
      expect(await db.listEvents(props.botId, 'es', FLAGGED_MESSAGE_STATUS.new)).toHaveLength(0)
    })

    it('Filters - by status', async () => {
      const props = {
        botId: 'bot1',
        eventId: '1234',
        language: 'en',
        preview: 'some message',
        reason: FLAG_REASON.action
      }

      await db.addEvent(props)
      await db.addEvent(props)
      await db.addEvent(props)

      const [{ id: id1 }, { id: id2 }, { id: id3 }] = await db.listEvents(
        props.botId,
        props.language,
        FLAGGED_MESSAGE_STATUS.new
      )
      await db.updateStatus(props.botId, id1.toString(), FLAGGED_MESSAGE_STATUS.pending)
      await db.updateStatus(props.botId, id2.toString(), FLAGGED_MESSAGE_STATUS.pending)
      await db.updateStatus(props.botId, id3.toString(), FLAGGED_MESSAGE_STATUS.deleted)

      expect(await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.pending)).toHaveLength(2)
      expect(await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.deleted)).toHaveLength(1)
      expect(await db.listEvents(props.botId, props.language, FLAGGED_MESSAGE_STATUS.new)).toHaveLength(0)
    })

    it('Filters - by reason', async () => {
      const props = {
        botId: 'bot1',
        eventId: '1234',
        language: 'en',
        preview: 'some message',
        reason: FLAG_REASON.action
      }

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
  })
})
