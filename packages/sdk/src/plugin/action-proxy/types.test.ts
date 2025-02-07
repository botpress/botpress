import { test } from 'vitest'
import { EmptyPlugin, FooBarBazPlugin } from '../../fixtures'
import { ActionProxy } from './types'
import * as utils from '../../utils/type-utils'
import { BasePlugin } from '../types'

test('ActionProxy of FooBarBazPlugin should reflect actions of bot, integration and interface deps', async () => {
  type Actual = ActionProxy<FooBarBazPlugin>
  type Expected = {
    fooBarBaz: {
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
    totoTutuTata: {
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
  type Actual = ActionProxy<EmptyPlugin>
  type Expected = {}

  type _assertion = utils.AssertAll<
    [
      //
      utils.IsExtend<Actual, Expected>,
      utils.IsExtend<Expected, Actual>,
      utils.IsEquivalent<Actual, Expected>,
    ]
  >
})

test('ActionProxy of BasePlugin should be a record', async () => {
  type Actual = ActionProxy<BasePlugin>
  type Expected = {
    [x: string]: {
      [x: string]: (args: any) => Promise<any>
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
