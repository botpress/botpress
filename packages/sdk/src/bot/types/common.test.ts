import { MakeChannel, MakeIntegration } from '../../integration/types/generic'
import { test } from 'vitest'
import * as utils from '../../utils/type-utils'
import { BaseBot, MakeBot } from './generic'
import * as types from './common'

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

test('EnumerateActions should enumerate actions', () => {
  type Bot = MakeBot<{
    integrations: {
      fooBarBaz: FooBarBazIntegration
    }
  }>
  type Actual = types.EnumerateActions<Bot>
  type Expected = {
    'fooBarBaz:doFoo': FooBarBazIntegration['actions']['doFoo']
    'fooBarBaz:doBar': FooBarBazIntegration['actions']['doBar']
    'fooBarBaz:doBaz': FooBarBazIntegration['actions']['doBaz']
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>
    ]
  >
})

test('EnumerateActions should return empty object if TBot is BaseBot', () => {
  type Actual = types.EnumerateActions<BaseBot>
  type Expected = {}
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<keyof Actual, keyof Expected>,
      utils.AssertExtends<keyof Expected, keyof Actual>
    ]
  >
})

test('EnumerateEvents should enumerate events', () => {
  type Bot = MakeBot<{
    integrations: {
      fooBarBaz: FooBarBazIntegration
    }
    events: {
      onQux: {
        eventQux: null
      }
    }
  }>
  type Actual = types.EnumerateEvents<Bot>
  type Expected = {
    'fooBarBaz:onFoo': FooBarBazIntegration['events']['onFoo']
    'fooBarBaz:onBar': FooBarBazIntegration['events']['onBar']
    'fooBarBaz:onBaz': FooBarBazIntegration['events']['onBaz']
    onQux: Bot['events']['onQux']
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>
    ]
  >
})

test('EnumerateEvents with only integration events should enumerate only integraiton events', () => {
  type Bot = MakeBot<{
    integrations: {
      fooBarBaz: FooBarBazIntegration
    }
  }>
  type Actual = types.EnumerateEvents<Bot>
  type Expected = {
    'fooBarBaz:onFoo': FooBarBazIntegration['events']['onFoo']
    'fooBarBaz:onBar': FooBarBazIntegration['events']['onBar']
    'fooBarBaz:onBaz': FooBarBazIntegration['events']['onBaz']
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>
    ]
  >
})

test('EnumerateEvents with only bot events should enumerate only bot events', () => {
  type Bot = MakeBot<{
    events: {
      onQux: {
        eventQux: null
      }
    }
  }>
  type Actual = types.EnumerateEvents<Bot>
  type Expected = {
    onQux: Bot['events']['onQux']
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>
    ]
  >
})

test('EnumerateEvents should return empty object if TBot is BaseBot', () => {
  type Actual = types.EnumerateEvents<BaseBot>
  type Expected = {}
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<keyof Actual, keyof Expected>,
      utils.AssertExtends<keyof Expected, keyof Actual>
    ]
  >
})

test('EnumerateChannels should enumerate channels', () => {
  type Bot = MakeBot<{
    integrations: {
      fooBarBaz: FooBarBazIntegration
    }
  }>
  type Actual = types.EnumerateChannels<Bot>
  type Expected = {
    'fooBarBaz:channelFoo': FooBarBazIntegration['channels']['channelFoo']
    'fooBarBaz:channelBar': FooBarBazIntegration['channels']['channelBar']
    'fooBarBaz:channelBaz': FooBarBazIntegration['channels']['channelBaz']
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>
    ]
  >
})

test('EnumerateChannels should return empty object if TBot is BaseBot', () => {
  type Actual = types.EnumerateChannels<BaseBot>
  type Expected = {}
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<keyof Actual, keyof Expected>,
      utils.AssertExtends<keyof Expected, keyof Actual>
    ]
  >
})

test('EnumerateMessages should enumerate messages', () => {
  type Bot = MakeBot<{
    integrations: {
      fooBarBaz: FooBarBazIntegration
    }
  }>
  type Actual = types.EnumerateMessages<Bot>
  type Expected = {
    'fooBarBaz:channelFoo:messageFoo': FooBarBazIntegration['channels']['channelFoo']['messages']['messageFoo']
    'fooBarBaz:channelBar:messageBar': FooBarBazIntegration['channels']['channelBar']['messages']['messageBar']
    'fooBarBaz:channelBaz:messageBaz': FooBarBazIntegration['channels']['channelBaz']['messages']['messageBaz']
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>
    ]
  >
})

test('EnumerateMessages should return empty object if TBot is BaseBot', () => {
  type Actual = types.EnumerateMessages<BaseBot>
  type Expected = {}
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<keyof Actual, keyof Expected>,
      utils.AssertExtends<keyof Expected, keyof Actual>
    ]
  >
})

test('GetMessages should return union of all channels per message', () => {
  type Bot = MakeBot<{
    integrations: {
      toto: MakeIntegration<{
        channels: {
          a: MakeChannel<{
            messages: {
              a: null
              x: string
            }
          }>
          b: MakeChannel<{
            messages: {
              b: null
              x: number
            }
          }>
          c: MakeChannel<{
            messages: {
              c: null
              x: boolean
            }
          }>
        }
      }>
    }
  }>
  type Actual = types.GetMessages<Bot>
  type Expected = {
    x: string | number | boolean // if we don't know the channel, x could be any of these types
    a: null
    b: null
    c: null
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>
    ]
  >
})
