import 'bluebird-global'
import 'jest-extended'
import 'reflect-metadata'
import * as sdk from 'botpress/sdk'
import { DefaultSearchParams, EventRepository } from './event-repository'
import Database from '../database'
import { createSpyObject, MockObject } from '../misc/utils'
import { PersistedConsoleLogger } from '../logger'

describe('Event Repository', () => {
  let logger: MockObject<PersistedConsoleLogger>
  let eventRepository: EventRepository

  let dateNow: Date
  let database: Database

  beforeEach(() => {
    logger = createSpyObject<PersistedConsoleLogger>()
    dateNow = new Date()
    database = new Database(logger.T)
    eventRepository = new EventRepository(database)
  })

  it('should call BOTPRESS_CORE_EVENT with correct event details', async () => {
    global.BOTPRESS_CORE_EVENT = jest.fn()
    const eventType: string = 'qna'

    const incomingEvent: sdk.IO.IncomingEvent = {
      id: '34',
      state: (undefined as unknown) as sdk.IO.EventState,
      type: 'text',
      direction: 'incoming',
      payload: 'empty',
      preview: 'bp test',
      createdOn: dateNow,
      channel: 'web',
      target: 'bot',
      botId: 'test-01',
      hasFlag: jest.fn(),
      setFlag: jest.fn(),
      decision: {
        confidence: 0.8,
        payloads: ['empty'],
        source: 'n/a',
        sourceDetails: '__qna_test-answer',
        decision: {
          status: 'dropped',
          reason: 'n/a'
        }
      }
    }

    const storedEvent: sdk.IO.StoredEvent = {
      id: '34',
      type: 'text',
      botId: 'test-01',
      incomingEventId: '1',
      target: 'bot',
      direction: 'incoming',
      channel: 'web',
      sessionId: '',
      createdOn: dateNow,
      event: incomingEvent
    }

    jest.spyOn(eventRepository, 'updateEvent').mockImplementation(jest.fn())

    jest
      .spyOn(eventRepository, 'findEvents')
      .mockImplementation(
        (
          { incomingEventId, target, direction }: Partial<sdk.IO.StoredEvent>,
          params: sdk.EventSearchParams = DefaultSearchParams
        ) => {
          return new Promise(resolve =>
            resolve([
              {
                ...storedEvent,
                incomingEventId: incomingEventId || '1',
                target: target || 'bot',
                direction: direction || 'incoming',
                event: {
                  ...storedEvent.event,
                  direction: direction || 'incoming'
                }
              }
            ])
          )
        }
      )

    await eventRepository.saveUserFeedback('1', storedEvent.target, 1, eventType)

    expect(global.BOTPRESS_CORE_EVENT).toHaveBeenLastCalledWith('bp_core_feedback_positive', {
      botId: storedEvent.botId,
      channel: storedEvent.channel,
      type: eventType,
      eventId: storedEvent.id,
      details: incomingEvent.decision?.sourceDetails
    })

    await eventRepository.saveUserFeedback('1', storedEvent.target, -1, eventType)

    expect(global.BOTPRESS_CORE_EVENT).toHaveBeenLastCalledWith('bp_core_feedback_negative', {
      botId: storedEvent.botId,
      channel: storedEvent.channel,
      type: eventType,
      eventId: storedEvent.id,
      details: incomingEvent.decision?.sourceDetails
    })
  })
})
