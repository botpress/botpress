import { test } from 'vitest'
import * as utils from '../../utils/type-utils'
import { BaseIntegration, DefaultIntegration } from './generic'

test('DefaultIntegration with empty input should return a valid BaseIntegration', () => {
  type Default = DefaultIntegration<{}>
  type _assertion = utils.AssertExtends<Default, BaseIntegration>
})

test('DefaultIntegration with missing key should return a valid BaseIntegration', () => {
  type Default = DefaultIntegration<{
    name: 'foo'
    version: '1.0.0'
    configuration: { foo: 'bar' }
  }>
  type _assertion = utils.AssertExtends<Default, BaseIntegration>
})

test('DefaultIntegration with missing channel key should return a valid BaseIntegration', () => {
  type Default = DefaultIntegration<{
    channels: {
      foo: {
        messages: { text: { text: string } }
      }
    }
  }>
  type _assertion = utils.AssertExtends<Default, BaseIntegration>
})
