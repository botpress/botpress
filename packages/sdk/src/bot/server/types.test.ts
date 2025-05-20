import { test } from 'vitest'
import * as client from '@botpress/client'
import * as utils from '../../utils/type-utils'
import * as common from '../common'
import * as types from './types'
import * as plugin from '../../plugin'
import { FooBarBazBot, EmptyBot } from '../../fixtures'

test('MessageRequest with implemented bot should be strict type', () => {
  type Actual = types.AnyIncomingMessage<FooBarBazBot>
  type MessageFoo = utils.Merge<client.Message, { type: 'messageFoo'; payload: { foo: string } }>
  type MessageBar = utils.Merge<client.Message, { type: 'messageBar'; payload: { bar: number } }>
  type MessageBaz = utils.Merge<client.Message, { type: 'messageBaz'; payload: { baz: boolean } }>
  type Expected = MessageFoo | MessageBar | MessageBaz
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('MessageRequest with empty bot should be never', () => {
  type Actual = types.AnyIncomingMessage<EmptyBot>
  type Expected = never // TODO: should be Merge<client.Message, { type: never; payload: never }>
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('MessageRequest with base bot should be any record', () => {
  type Actual = types.AnyIncomingMessage<common.BaseBot>
  type Expected = utils.Merge<client.Message, { type: string; payload: any }> // TODO: should be { message: Record<string, any> }
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('IncomingCallActionRequest with FooBarBazBot should be strict type', () => {
  type Actual = types.IncomingCallActionRequest<FooBarBazBot>
  type Expected = {
    act: {
      type: 'act'
      input: { arguments: Record<string, unknown> }
    }
    do: {
      type: 'do'
      input: { parameters: Record<string, number> }
    }
    '*':
      | {
          type: 'act'
          input: { arguments: Record<string, unknown> }
        }
      | {
          type: 'do'
          input: { parameters: Record<string, number> }
        }
  }

  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('IncomingCallActionRequest with EmptyBot should be never', () => {
  type Actual = types.IncomingCallActionRequest<EmptyBot>
  type Expected = {
    '*': never
  }
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('IncomingCallActionRequest with BaseBot should be record', () => {
  type Actual = types.IncomingCallActionRequest<common.BaseBot>
  type Expected = {
    [key: string]: { type: string; input: any }
    '*': { type: string; input: any }
  }
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('IncomingCallActionResponses with FooBarBazBot should be strict type', () => {
  type Actual = types.IncomingCallActionResponses<FooBarBazBot>
  type Expected = {
    act: { type: 'act'; output: { result: unknown } }
    do: { type: 'do'; output: { result: number } }
    '*':
      | {
          type: 'act'
          output: { result: unknown }
        }
      | {
          type: 'do'
          output: { result: number }
        }
  }

  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('IncomingCallActionResponses with EmptyBot should be never', () => {
  type Actual = types.IncomingCallActionResponses<EmptyBot>
  type Expected = {
    '*': never
  }
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('IncomingCallActionResponses with BaseBot should be record', () => {
  type Actual = types.IncomingCallActionResponses<common.BaseBot>
  type Expected = {
    [key: string]: { type: string; output: any }
    '*': { type: string; output: any }
  }
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('Bot should only require to implement actions that are not already implemented by plugins', () => {
  type DoSomethingPlugin = plugin.DefaultPlugin<{
    actions: {
      doSomething: {
        input: { x: number }
        output: { y: number }
      }
    }
  }>
  type MakeSomethingPlugin = plugin.DefaultPlugin<{
    actions: {
      makeSomething: {
        input: { x1: number; x2: number }
        output: { z: number }
      }
    }
  }>
  type Plugins = { do: DoSomethingPlugin; make: MakeSomethingPlugin }

  type ActualImplementedActions = types.ImplementedActionHandlers<FooBarBazBot, Plugins>
  type ActualUnimplementedActions = types.UnimplementedActionHandlers<FooBarBazBot, Plugins>

  type ExpectedImplementedActions = 'doSomething' | 'makeSomething'
  type ExpectedUnimplementedActions = 'act' | 'do'

  type _assertion = utils.AssertAll<
    [
      utils.AssertTrue<utils.IsEqual<keyof ActualImplementedActions, ExpectedImplementedActions>>,
      utils.AssertTrue<utils.IsEqual<keyof ActualUnimplementedActions, ExpectedUnimplementedActions>>,
    ]
  >
})
