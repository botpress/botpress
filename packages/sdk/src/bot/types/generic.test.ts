import { test } from 'vitest'
import * as utils from '../../utils/type-utils'
import { BaseBot, DefaultBot } from './generic'

test('DefaultBot with empty input should return a valid BaseBot', () => {
  type Default = DefaultBot<{}>
  type _assertion = utils.AssertExtends<Default, BaseBot>
})

test('DefaultBot with missing key should return a valid BaseBot', () => {
  type Default = DefaultBot<{
    states: {
      foo: {
        current: string
      }
    }
  }>
  type _assertion = utils.AssertExtends<Default, BaseBot>
})

test('DefaultBot with missing integration key should return a valid BaseBot', () => {
  type Default = DefaultBot<{
    integrations: {
      foo: {
        name: 'foo'
        version: '1.0.0'
        configuration: { token: string }
      }
    }
  }>
  type _assertion = utils.AssertExtends<Default, BaseBot>
})

test('DefaultBot with missing integration channel key should return a valid BaseBot', () => {
  type Default = DefaultBot<{
    integrations: {
      foo: {
        name: 'foo'
        version: '1.0.0'
        configuration: { token: string }
        channels: {
          bar: {
            messages: { text: { text: string } }
          }
        }
      }
    }
  }>
  type _assertion = utils.AssertExtends<Default, BaseBot>
})
