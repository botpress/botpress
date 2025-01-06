import { test } from 'vitest'
import * as utils from '../../utils/type-utils'
import { BasePlugin, DefaultPlugin } from './generic'
import { BaseBot } from 'src/bot'

test('BasePlugin is a BaseBot', () => {
  type _assertion = utils.AssertExtends<BasePlugin, BaseBot>
})

test('DefaulPlugin with empty input should return a valid BasePlugin', () => {
  type Default = DefaultPlugin<{}>
  type _assertion = utils.AssertExtends<Default, BasePlugin>
})

test('DefaulPlugin with missing key should return a valid BasePlugin', () => {
  type Default = DefaultPlugin<{
    states: {
      foo: {
        current: string
      }
    }
  }>
  type _assertion = utils.AssertExtends<Default, BasePlugin>
})
