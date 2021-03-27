import Db, { TABLE_NAME } from './db'
import { FLAGGED_MESSAGE_STATUS, FLAG_REASON } from '../types'
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
      await db.updateStatus(props.botId, id1.toString(), FLAGGED_MESSAGE_STATUS.pending)
      await db.updateStatus(props.botId, id2.toString(), FLAGGED_MESSAGE_STATUS.pending)
      await db.updateStatus(props.botId, id3.toString(), FLAGGED_MESSAGE_STATUS.deleted)

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
})
