import { test } from 'vitest'
import * as client from '@botpress/client'
import * as utils from '../../utils/type-utils'
import * as common from '../common'
import * as types from './types'
import { EmptyPlugin, FooBarBazPlugin } from '../../fixtures'

test('MessageRequest with implemented plugin should be loose type', () => {
  type Actual = types.AnyIncomingMessage<FooBarBazPlugin>
  type Expected = client.Message
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('MessageRequest with empty plugin should be loose type', () => {
  type Actual = types.AnyIncomingMessage<EmptyPlugin>
  type Expected = client.Message
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('MessageRequest with base plugin should be loose type', () => {
  type Actual = types.AnyIncomingMessage<common.BasePlugin>
  type Expected = client.Message
  type _assertion = utils.AssertAll<
    [
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

test('HookHandlers with implemented plugin should always extend AnyHookHandler', () => {
  type Actual = types.HookHandlers<FooBarBazPlugin>
  type Expected = Record<types.HookDefinitionType, Record<string, types.AnyHookHandler<FooBarBazPlugin>>>
  type _assertion = utils.AssertExtends<Actual, Expected>
})

test('HookHandlers with empty plugin should always extend AnyHookHandler', () => {
  type Actual = types.HookHandlers<EmptyPlugin>
  type Expected = Record<types.HookDefinitionType, Record<string, types.AnyHookHandler<EmptyPlugin>>>
  type _assertion = utils.AssertExtends<Actual, Expected>
})

test('HookHandlers with base plugin should always extend AnyHookHandler', () => {
  type Actual = types.HookHandlers<common.BasePlugin>
  type Expected = Record<types.HookDefinitionType, Record<string, types.AnyHookHandler<common.BasePlugin>>>
  type _assertion = utils.AssertExtends<Actual, Expected>
})
