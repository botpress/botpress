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
    tags: {
      fooMessageTag1: ''
      fooMessageTag2: ''
      fooMessageTag3: ''
    }
    payload: {
      foo: string
    }
  }
  type _assertion = utils.AssertTrue<utils.IsEqual<Actual, Expected>>
})
