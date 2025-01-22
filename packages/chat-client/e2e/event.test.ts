import { expect, test } from 'vitest'
import _ from 'lodash'
import * as config from './config'
import * as chat from '../src'

const apiUrl = config.get('API_URL')

test('api allows sending and receiving custom events', async () => {
  const client = await chat.Client.connect({ apiUrl, debug: true })

  const {
    conversation: { id: conversationId },
  } = await client.createConversation({})

  const listener = await client.listenConversation({
    id: conversationId,
  })

  const waitForEventPromise = new Promise<chat.Signals['event_created']>((resolve) => {
    listener.onceOrMore('event_created', (ev) => {
      if (ev.userId === client.user.id) {
        return 'keep-listening'
      }
      resolve(ev)
      return 'stop-listening'
    })
  })

  const createEventRequest: chat.AuthenticatedClientRequests['createEvent'] = {
    conversationId: conversationId,
    payload: {
      foo: 'bar',
    },
  }

  const createEventPromise = client.createEvent(createEventRequest).then((res) => res.event)

  const [eventReceived, eventSent] = await Promise.all([waitForEventPromise, createEventPromise])

  const { event: eventFetched } = await client.getEvent({
    id: eventSent.id,
  })

  expect(eventFetched).toEqual(eventSent)
  expect(eventReceived.payload).toEqual(eventSent.payload) // hello bot just passes the payload through
}, 20_000)
