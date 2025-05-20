import * as apiUtils from '../api'
import * as client from '@botpress/client'
import * as utils from '../utils'
import { IntegrationDefinition, InterfaceDefinition, PluginDefinition } from './typings'
import { test } from 'vitest'

test('integration response extends integration definition', () => {
  type Actual = client.Integration
  type Expected = IntegrationDefinition
  type _assertion = utils.types.AssertExtends<Actual, Expected>
})

test('integration request extends integration definition', () => {
  type Actual = client.ClientInputs['createIntegration']
  type Expected = IntegrationDefinition
  type _assertion = utils.types.AssertExtends<Actual, Expected>
})

test('interface response extends interface definition', () => {
  type Actual = client.Interface
  type Expected = InterfaceDefinition
  type _assertion = utils.types.AssertExtends<Actual, Expected>
})

test('interface request extends interface definition', () => {
  type Actual = client.ClientInputs['createInterface']
  type Expected = InterfaceDefinition
  type _assertion = utils.types.AssertExtends<Actual, Expected>
})

test('plugin response extends plugin definition', () => {
  type Actual = client.Plugin
  type Expected = PluginDefinition
  type _assertion = utils.types.AssertExtends<Actual, Expected>
})

test('plugin request extends plugin definition', () => {
  type Actual = apiUtils.CreatePluginRequestBody & { code: string }
  type Expected = PluginDefinition
  type _assertion = utils.types.AssertExtends<Actual, Expected>
})
