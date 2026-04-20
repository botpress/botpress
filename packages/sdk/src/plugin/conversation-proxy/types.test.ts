import { it, describe } from 'vitest'
import type { EmptyPlugin, FooBarBazPlugin } from '../../fixtures'
import type { ConversationFinder, ActionableConversation } from './types'
import type * as typeUtils from '../../utils/type-utils'
import type * as client from '@botpress/client'

type _ExtractMessageType<T> = T extends ActionableConversation<any, any, infer TMessage> ? TMessage : never

describe.concurrent.skip('ConversationProxy', () => {
  describe.concurrent('With FooBarBazPlugin', () => {
    it('should reflect interfaces and channels of plugin dependencies', () => {
      type Actual = ConversationFinder<FooBarBazPlugin>
      type Expected = {
        fooBarBaz: {
          '*': any
          channelFoo: any
          channelBar: any
          channelBaz: any
        }
        totoTutuTata: {
          '*': any
          channelFoo: any
          channelBar: any
          channelBaz: any
        }
        '*': {
          '*': any
        }
      }

      type _assertion = typeUtils.AssertTrue<typeUtils.IsEquivalent<Actual, Expected>>
    })

    it('should correctly infer message types for specific channels', () => {
      type Actual = _ExtractMessageType<
        Awaited<ReturnType<ConversationFinder<FooBarBazPlugin>['fooBarBaz']['channelFoo']['getById']>>
      >
      type Expected = Omit<client.Message, 'tags' | 'type' | 'payload'> & {
        // Type and payload come from the interface/integration:
        type: 'messageFoo'
        payload: {
          foo: string
        }
        // Tags come from the plugin:
        tags: {
          pluginMessageTag1?: string
          pluginMessageTag2?: string
          pluginMessageTag3?: string
        }
      }

      type _assertion = typeUtils.AssertTrue<typeUtils.IsEquivalent<Actual, Expected>>
    })
  })

  describe.concurrent('With EmptyPlugin', () => {
    it('should only have wildcards', () => {
      type Actual = ConversationFinder<EmptyPlugin>
      type Expected = {
        '*': {
          '*': any
        }
      }

      type _assertion = typeUtils.AssertTrue<typeUtils.IsEquivalent<Actual, Expected>>
    })

    it('should correctly infer message types for specific channels', () => {
      type Actual = _ExtractMessageType<Awaited<ReturnType<ConversationFinder<EmptyPlugin>['*']['*']['getById']>>>
      type Expected = Omit<client.Message, 'tags'> & {
        // EmptyPlugin has no message tags:
        tags: Record<string, string>
      }

      type _assertion = typeUtils.AssertTrue<typeUtils.IsEquivalent<Actual, Expected>>
    })
  })
})
