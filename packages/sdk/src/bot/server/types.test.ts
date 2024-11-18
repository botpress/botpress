import { test } from 'vitest'
import * as client from '@botpress/client'
import * as utils from '../../utils/type-utils'
import * as common from '../types'
import * as types from './types'

type FooBarBazIntegration = common.MakeIntegration<{
  actions: {
    doFoo: {
      input: {
        inputFoo: string
      }
      output: {
        outputFoo: string
      }
    }
    doBar: {
      input: {
        inputBar: number
      }
      output: {
        outputBar: number
      }
    }
    doBaz: {
      input: {
        inputBaz: boolean
      }
      output: {
        outputBaz: boolean
      }
    }
  }
  events: {
    onFoo: {
      eventFoo: string
    }
    onBar: {
      eventBar: number
    }
    onBaz: {
      eventBaz: boolean
    }
  }
  channels: {
    channelFoo: common.MakeChannel<{
      messages: {
        messageFoo: {
          foo: string
        }
      }
    }>
    channelBar: common.MakeChannel<{
      messages: {
        messageBar: {
          bar: number
        }
      }
    }>
    channelBaz: common.MakeChannel<{
      messages: {
        messageBaz: {
          baz: boolean
        }
      }
    }>
  }
}>

type FooBarBazBot = common.MakeBot<{
  integrations: {
    fooBarBaz: FooBarBazIntegration
  }
  events: {
    onQux: {
      eventQux: string
    }
  }
  states: {
    foo: {
      foo: string
    }
    bar: {
      bar: number
    }
    baz: {
      baz: boolean
    }
  }
}>

type EmptyBot = common.MakeBot<{
  integrations: {}
  events: {}
  states: {}
}>

test('MessageRequest with implemented bot should be strict type', () => {
  type Actual = types.IncomingMessage<FooBarBazBot>
  type MessageFoo = utils.Merge<client.Message, { type: 'messageFoo'; payload: { foo: string } }>
  type MessageBar = utils.Merge<client.Message, { type: 'messageBar'; payload: { bar: number } }>
  type MessageBaz = utils.Merge<client.Message, { type: 'messageBaz'; payload: { baz: boolean } }>
  type Expected = MessageFoo | MessageBar | MessageBaz
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>
    ]
  >
})

test('MessageRequest with empty bot should be never', () => {
  type Actual = types.IncomingMessage<EmptyBot>
  type Expected = never // TODO: should be Merge<client.Message, { type: never; payload: never }>
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>
    ]
  >
})

test('MessageRequest with base bot should be any record', () => {
  type Actual = types.IncomingMessage<common.BaseBot>
  type Expected = utils.Merge<client.Message, { type: string; payload: any }> // TODO: should be { message: Record<string, any> }
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>
    ]
  >
})
