import * as client from '@botpress/client'
import { test } from 'vitest'
import { HookDefinitions } from './common'
import { BasePlugin } from './generic'
import * as utils from '../../utils/type-utils'

test('before_incoming_event definition should be a record of event response', () => {
  type Actual = HookDefinitions<BasePlugin>['before_incoming_event']
  type _assertion = utils.AssertExtends<Actual, Record<string, client.Event>>
})
test('before_incoming_message definition should be a record of message response', () => {
  type Actual = HookDefinitions<BasePlugin>['before_incoming_message']
  type _assertion = utils.AssertExtends<Actual, Record<string, client.Message>>
})
test('before_outgoing_message definition should be a record of createMessage request ', () => {
  type Actual = HookDefinitions<BasePlugin>['before_outgoing_message']
  type _assertion = utils.AssertExtends<Actual, Record<string, client.ClientInputs['createMessage']>>
})
test('before_call_action definition should be a record of callAction request', () => {
  type Actual = HookDefinitions<BasePlugin>['before_call_action']
  type _assertion = utils.AssertExtends<Actual, Record<string, client.ClientInputs['callAction']>>
})
test('after_incoming_event definition should be a record of event response', () => {
  type Actual = HookDefinitions<BasePlugin>['after_incoming_event']
  type _assertion = utils.AssertExtends<Actual, Record<string, client.Event>>
})
test('after_incoming_message definition should be a record of message response', () => {
  type Actual = HookDefinitions<BasePlugin>['after_incoming_message']
  type _assertion = utils.AssertExtends<Actual, Record<string, client.Message>>
})
test('after_outgoing_message definition should be a record of createMessage response', () => {
  type Actual = HookDefinitions<BasePlugin>['after_outgoing_message']
  type _assertion = utils.AssertExtends<Actual, Record<string, client.ClientOutputs['createMessage']>>
})
test('after_call_action definition should be a record of callAction response', () => {
  type Actual = HookDefinitions<BasePlugin>['after_call_action']
  type _assertion = utils.AssertExtends<Actual, Record<string, client.ClientOutputs['callAction']>>
})
