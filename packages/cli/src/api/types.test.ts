import { test } from 'vitest'
import { AssertExtends } from '../utils/type-utils'
import * as client from '@botpress/client'
import * as types from './types'

test('CreateIntegrationRequestBody extends ClientInputs["createIntegration"]', () => {
  type Actual = types.CreateIntegrationRequestBody
  type Expected = client.ClientInputs['createIntegration']
  type _assertion1 = AssertExtends<Actual, Expected>

  // @ts-expect-error
  type _assertion2 = AssertExtends<Expected, Actual>
})

test('UpdateIntegrationRequestBody extends ClientInputs["updateIntegration"]', () => {
  type Actual = types.UpdateIntegrationRequestBody
  type Expected = client.ClientInputs['updateIntegration']
  type _assertion1 = AssertExtends<Actual, Expected>

  // @ts-expect-error
  type _assertion2 = AssertExtends<Expected, Actual>
})

test('client.Integration extends InferredIntegrationResponseBody', () => {
  type Actual = client.Integration
  type Expected = types.InferredIntegrationResponseBody
  type _assertion1 = AssertExtends<Actual, Expected>

  // @ts-expect-error
  type _assertion2 = AssertExtends<Expected, Actual>
})

test('client.Interface extends InferredInterfaceResponseBody', () => {
  type Actual = client.Interface
  type Expected = types.InferredInterfaceResponseBody
  type _assertion1 = AssertExtends<Actual, Expected>

  // @ts-expect-error
  type _assertion2 = AssertExtends<Expected, Actual>
})

test('client.Plugin extends InferredPluginResponseBody', () => {
  type Actual = client.Plugin
  type Expected = types.InferredPluginResponseBody
  type _assertion1 = AssertExtends<Actual, Expected>

  // @ts-expect-error
  type _assertion2 = AssertExtends<Expected, Actual>
})
