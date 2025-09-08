import { FooBarBazIntegration } from 'src/fixtures'
import * as utils from '../../utils/type-utils'
import {
  ConversationTags,
  MessageTags,
  TagsOfMessage,
  GetChannelByName,
  GetMessageByName,
  EnumerateMessages,
} from './sub-types'
import { test } from 'vitest'

test('ConversationTags', () => {
  type Actual = ConversationTags<FooBarBazIntegration>
  type Expected =
    | 'fooConversationTag1'
    | 'fooConversationTag2'
    | 'fooConversationTag3'
    | 'barConversationTag1'
    | 'barConversationTag2'
    | 'barConversationTag3'
    | 'bazConversationTag1'
    | 'bazConversationTag2'
    | 'bazConversationTag3'
  type _assertion = utils.AssertTrue<utils.IsEqual<Actual, Expected>>
})

test('MessageTags', () => {
  type Actual = MessageTags<FooBarBazIntegration>
  type Expected =
    | 'fooMessageTag1'
    | 'fooMessageTag2'
    | 'fooMessageTag3'
    | 'barMessageTag1'
    | 'barMessageTag2'
    | 'barMessageTag3'
    | 'bazMessageTag1'
    | 'bazMessageTag2'
    | 'bazMessageTag3'
  type _assertion = utils.AssertTrue<utils.IsEqual<Actual, Expected>>
})

test('TagsOfMessage with specific message', () => {
  type Actual = TagsOfMessage<FooBarBazIntegration, 'messageFoo'>
  type Expected = 'fooMessageTag1' | 'fooMessageTag2' | 'fooMessageTag3'
  type _assertion = utils.AssertTrue<utils.IsEqual<Actual, Expected>>
})

test('TagsOfMessage with specific message', () => {
  type Actual = TagsOfMessage<FooBarBazIntegration, keyof EnumerateMessages<FooBarBazIntegration>>
  type Expected =
    | 'fooMessageTag1'
    | 'fooMessageTag2'
    | 'fooMessageTag3'
    | 'barMessageTag1'
    | 'barMessageTag2'
    | 'barMessageTag3'
    | 'bazMessageTag1'
    | 'bazMessageTag2'
    | 'bazMessageTag3'
  type _assertion = utils.AssertTrue<utils.IsEqual<Actual, Expected>>
})

test('EnumerateMessages of FooBarBazIntegration returns union of all message types', () => {
  type Actual = EnumerateMessages<FooBarBazIntegration>
  type Expected = {
    messageFoo: {
      type: 'messageFoo'
      tags: {
        fooMessageTag1?: string
        fooMessageTag2?: string
        fooMessageTag3?: string
      }
      payload: {
        foo: string
      }
    }
    messageBar: {
      type: 'messageBar'
      tags: {
        barMessageTag1?: string
        barMessageTag2?: string
        barMessageTag3?: string
      }
      payload: {
        bar: number
      }
    }
    messageBaz: {
      type: 'messageBaz'
      tags: {
        bazMessageTag1?: string
        bazMessageTag2?: string
        bazMessageTag3?: string
      }
      payload: {
        baz: boolean
      }
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

test('GetChannelByName', () => {
  type Actual = GetChannelByName<FooBarBazIntegration, 'channelFoo'>
  type Expected = {
    messages: {
      messageFoo: {
        foo: string
      }
    }
    message: {
      tags: {
        fooMessageTag1: ''
        fooMessageTag2: ''
        fooMessageTag3: ''
      }
    }
    conversation: {
      tags: {
        fooConversationTag1: ''
        fooConversationTag2: ''
        fooConversationTag3: ''
      }
    }
  }
  type _assertion = utils.AssertTrue<utils.IsEqual<Actual, Expected>>
})

test('GetMessageByName', () => {
  type Actual = GetMessageByName<FooBarBazIntegration, 'messageFoo'>
  type Expected = {
    type: 'messageFoo'
    tags: {
      fooMessageTag1?: string
      fooMessageTag2?: string
      fooMessageTag3?: string
    }
    payload: {
      foo: string
    }
  }
  type _assertion = utils.AssertTrue<utils.IsEqual<Actual, Expected>>
})
