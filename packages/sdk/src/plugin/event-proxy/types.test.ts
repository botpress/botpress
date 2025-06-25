import { test } from 'vitest'
import { EmptyPlugin, FooBarBazPlugin } from '../../fixtures'
import { EventProxy, EventSchedule, EventSender } from './types'
import * as utils from '../../utils/type-utils'
import { BasePlugin } from '../common'

test('EventProxy of FooBarBazPlugin should reflect states of bot, integration and interface deps', async () => {
  type EventPayload = { a: string; b: number; c: boolean }
  type Expected = utils.Normalize<{
    somethingHappened: {
      emit: (event: EventPayload) => Promise<void>
      schedule: (event: EventPayload, schedule: EventSchedule) => Promise<void>
      withConversationId: (conversationId: string) => EventSender<EventPayload>
      withUserId: (userId: string) => EventSender<EventPayload>
      withMessageId: (messageId: string) => EventSender<EventPayload>
    }
  }>

  type Actual = EventProxy<FooBarBazPlugin>

  type _assertion = utils.AssertAll<
    [
      //
      utils.IsExtend<Actual, Expected>,
      utils.IsExtend<Expected, Actual>,
      utils.IsEquivalent<Actual, Expected>,
    ]
  >
})

test('EventProxy of EmptyPlugin should be almost empty', async () => {
  type Actual = EventProxy<EmptyPlugin>
  type Expected = {}

  type _assertion = utils.AssertAll<
    [
      //
      utils.IsExtend<Actual, Expected>,
      utils.IsExtend<Expected, Actual>,
      utils.IsIdentical<Actual, Expected>,
    ]
  >
})

test('EventProxy of BasePlugin should be a record', async () => {
  type Actual = EventProxy<BasePlugin>
  type Expected = {
    [x: string]: {
      emit: (event: any) => Promise<void>
      schedule: (event: any, schedule: EventSchedule) => Promise<void>
      withConversationId: (conversationId: string) => EventSender<any>
      withUserId: (userId: string) => EventSender<any>
      withMessageId: (messageId: string) => EventSender<any>
    }
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.IsExtend<Actual, Expected>,
      utils.IsExtend<Expected, Actual>,
      utils.IsIdentical<Actual, Expected>,
    ]
  >
})
