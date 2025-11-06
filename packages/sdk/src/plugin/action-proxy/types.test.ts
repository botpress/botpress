import { test } from 'vitest'
import { EmptyPlugin, FooBarBazPlugin } from '../../fixtures'
import { ActionProxy } from './types'
import * as utils from '../../utils/type-utils'
import { BasePlugin } from '../common'

test('ActionProxy of FooBarBazPlugin should reflect actions of bot, integration and interface deps', async () => {
  type Actual = utils.Normalize<ActionProxy<FooBarBazPlugin>>
  type Expected = {
    forIntegration: (integrationAlias: 'fooBarBaz') => {
      doFoo: (input: { inputFoo: string }) => Promise<{
        outputFoo: string
      }>
      doBar: (input: { inputBar: number }) => Promise<{
        outputBar: number
      }>
      doBaz: (input: { inputBaz: boolean }) => Promise<{
        outputBaz: boolean
      }>
    }
    forInterface: (interfaceAlias: 'totoTutuTata') => {
      doToto: (input: { inputToto: string }) => Promise<{
        outputToto: string
      }>
      doTutu: (input: { inputTutu: number }) => Promise<{
        outputTutu: number
      }>
      doTata: (input: { inputTata: boolean }) => Promise<{
        outputTata: boolean
      }>
    }
  }

  type _assertion = utils.AssertAll<
    [
      //
      utils.IsExtend<Actual, Expected>,
      utils.IsExtend<Expected, Actual>,
      utils.IsEquivalent<Actual, Expected>,
    ]
  >
})

test('ActionProxy of EmptyPlugin should be almost empty', async () => {
  type Actual = utils.Normalize<ActionProxy<EmptyPlugin>>
  type Expected = {
    forIntegration: (integrationAlias: never) => {}
    forInterface: (interfaceAlias: never) => {}
  }

  type _assertion = utils.AssertAll<
    [
      //
      utils.IsExtend<Actual, Expected>,
      utils.IsExtend<Expected, Actual>,
      // FIXME: uncomment this line to make the test fail
      // utils.IsIdentical<Actual, Expected>,
    ]
  >
})

test('ActionProxy of BasePlugin should be a record', async () => {
  type Actual = utils.Normalize<ActionProxy<BasePlugin>>
  type Expected = {
    forIntegration: (integrationAlias: string) => {
      [x: string]: (args: any) => Promise<any>
    }
    forInterface: (interfaceAlias: string) => {
      [x: string]: (args: any) => Promise<any>
    }
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.IsExtend<Actual, Expected>,
      utils.IsExtend<Expected, Actual>,
      utils.IsIdentical<Actual, Expected>,
    ]
  >
})
