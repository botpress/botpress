import * as client from '@botpress/client'
import { MakeChannel, MakeIntegration } from '../../integration/types/generic'
import { describe, test } from 'vitest'
import * as utils from '../../utils/type-utils'
import * as types from './types'
import { MakeBot, BaseBot } from '../types'

type FooBarBazIntegration = MakeIntegration<{
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
    channelFoo: MakeChannel<{
      messages: {
        messageFoo: {
          foo: string
        }
      }
    }>
    channelBar: MakeChannel<{
      messages: {
        messageBar: {
          bar: number
        }
      }
    }>
    channelBaz: MakeChannel<{
      messages: {
        messageBaz: {
          baz: boolean
        }
      }
    }>
  }
}>

type FooBarBazBot = MakeBot<{
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

type EmptyBot = MakeBot<{
  integrations: {}
  events: {}
  states: {}
}>

describe('ClientInputs', () => {
  test('CreateMessage with implemented bot should require strict type', () => {
    type Actual = types.ClientInputs<FooBarBazBot>['createMessage']
    type Expected = utils.Merge<
      client.ClientInputs['createMessage'],
      {
        type: 'messageFoo' | 'messageBar' | 'messageBaz'
        payload:
          | {
              foo: string
            }
          | {
              bar: number
            }
          | {
              baz: boolean
            }
      }
    >
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertExtends<Actual, Expected>,
        utils.AssertExtends<Expected, Actual>,
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>
      ]
    >
  })
  test('CreateMessage with empty bot should be never', () => {
    type Actual = types.ClientInputs<EmptyBot>['createMessage']
    type Expected = utils.Merge<client.ClientInputs['createMessage'], { type: never; payload: never }>
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertExtends<Actual, Expected>,
        utils.AssertExtends<Expected, Actual>,
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>
      ]
    >
  })
  test('CreateMessage with base bot should allow passing any record', () => {
    type Actual = types.ClientInputs<BaseBot>['createMessage']
    type Expected = utils.Merge<client.ClientInputs['createMessage'], { type: string; payload: any }> // TODO: should be { payload: Record<string, any> }
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertExtends<Actual, Expected>,
        utils.AssertExtends<Expected, Actual>,
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>
      ]
    >
  })
})
describe('ClientOutputs', () => {
  test('CreateMessage with implemented bot should require strict type', () => {
    type Actual = types.ClientOutputs<FooBarBazBot>['createMessage']

    type FooMessage = utils.Merge<client.Message, { type: 'messageFoo'; payload: { foo: string } }>
    type BarMessage = utils.Merge<client.Message, { type: 'messageBar'; payload: { bar: number } }>
    type BazMessage = utils.Merge<client.Message, { type: 'messageBaz'; payload: { baz: boolean } }>
    type Expected = utils.Merge<
      client.ClientOutputs['createMessage'],
      {
        message: FooMessage | BarMessage | BazMessage
      }
    >

    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertExtends<Actual, Expected>,
        utils.AssertExtends<Expected, Actual>,
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>
      ]
    >
  })
  test('CreateMessage with empty bot should be never', () => {
    type Actual = types.ClientOutputs<EmptyBot>['createMessage']
    type Expected = {
      message: never // TODO: should be Merge<client.Message, { type: never; payload: never }>
    }
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertExtends<Actual, Expected>,
        utils.AssertExtends<Expected, Actual>,
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>
      ]
    >
  })
  test('CreateMessage with base bot should allow passing any record', () => {
    type Actual = types.ClientOutputs<BaseBot>['createMessage']
    type Expected = {
      message: utils.Merge<client.Message, { type: string; payload: any }> // TODO: should be { message: Record<string, any> }
    }
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertExtends<Actual, Expected>,
        utils.AssertExtends<Expected, Actual>,
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>
      ]
    >
  })
})
