import * as client from '@botpress/client'
import { describe, test } from 'vitest'
import * as utils from '../../utils/type-utils'
import * as types from './types'
import { BaseBot } from '../types'
import { FooBarBazBot, EmptyBot } from '../../fixtures'

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
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
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
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
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
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
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
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
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
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
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
        utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
      ]
    >
  })
})

describe('ClientOperations', () => {
  test('getConversation of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['getConversation']
    type General = client.Client['getConversation']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('listConversations of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['listConversations']
    type General = client.Client['listConversations']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('updateConversation of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['updateConversation']
    type General = client.Client['updateConversation']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('deleteConversation of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['deleteConversation']
    type General = client.Client['deleteConversation']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('listParticipants of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['listParticipants']
    type General = client.Client['listParticipants']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('addParticipant of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['addParticipant']
    type General = client.Client['addParticipant']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('getParticipant of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['getParticipant']
    type General = client.Client['getParticipant']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('removeParticipant of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['removeParticipant']
    type General = client.Client['removeParticipant']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('getEvent of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['getEvent']
    type General = client.Client['getEvent']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('listEvents of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['listEvents']
    type General = client.Client['listEvents']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('createMessage of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['createMessage']
    type General = client.Client['createMessage']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('getOrCreateMessage of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['getOrCreateMessage']
    type General = client.Client['getOrCreateMessage']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('getMessage of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['getMessage']
    type General = client.Client['getMessage']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('updateMessage of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['updateMessage']
    type General = client.Client['updateMessage']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('listMessages of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['listMessages']
    type General = client.Client['listMessages']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('deleteMessage of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['deleteMessage']
    type General = client.Client['deleteMessage']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('getUser of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['getUser']
    type General = client.Client['getUser']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('listUsers of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['listUsers']
    type General = client.Client['listUsers']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('updateUser of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['updateUser']
    type General = client.Client['updateUser']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('deleteUser of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['deleteUser']
    type General = client.Client['deleteUser']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('getState of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['getState']
    type General = client.Client['getState']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('setState of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['setState']
    type General = client.Client['setState']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('getOrSetState of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['getOrSetState']
    type General = client.Client['getOrSetState']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('patchState of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['patchState']
    type General = client.Client['patchState']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('callAction of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['callAction']
    type General = client.Client['callAction']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('uploadFile of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['uploadFile']
    type General = client.Client['uploadFile']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('upsertFile of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['upsertFile']
    type General = client.Client['upsertFile']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('deleteFile of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['deleteFile']
    type General = client.Client['deleteFile']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('listFiles of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['listFiles']
    type General = client.Client['listFiles']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('getFile of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['getFile']
    type General = client.Client['getFile']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('updateFileMetadata of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['updateFileMetadata']
    type General = client.Client['updateFileMetadata']
    type _assertion = utils.AssertExtends<Specific, General>
  })
  test('searchFiles of BotSpecificClient extends General', () => {
    type Specific = types.ClientOperations<BaseBot>['searchFiles']
    type General = client.Client['searchFiles']
    type _assertion = utils.AssertExtends<Specific, General>
  })
})
