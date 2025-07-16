import { test } from 'vitest'
import { EmptyPlugin, FooBarBazPlugin } from '../../fixtures'
import { StateProxy, StateRepo } from './types'
import * as utils from '../../utils/type-utils'
import { BasePlugin } from '../common'

test('StateProxy of FooBarBazPlugin should reflect states of bot, integration and interface deps', async () => {
  type Expected = utils.Normalize<{
    conversation: {
      alpha: StateRepo<FooBarBazPlugin['states']['alpha']['payload']>
      delta: StateRepo<FooBarBazPlugin['states']['delta']['payload']>
    }
    user: {
      beta: StateRepo<FooBarBazPlugin['states']['beta']['payload']>
    }
    bot: {
      gamma: StateRepo<FooBarBazPlugin['states']['gamma']['payload']>
    }
    workflow: {
      epsilon: StateRepo<FooBarBazPlugin['states']['epsilon']['payload']>
    }
  }>

  type Actual = StateProxy<FooBarBazPlugin>

  type _assertion = utils.AssertAll<
    [
      //
      utils.IsExtend<Actual, Expected>,
      utils.IsExtend<Expected, Actual>,
      utils.IsEquivalent<Actual, Expected>,
    ]
  >
})

test('StateProxy of EmptyPlugin should be almost empty', async () => {
  type Actual = StateProxy<EmptyPlugin>
  type Expected = {
    conversation: {}
    user: {}
    bot: {}
    workflow: {}
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

test('StateProxy of BasePlugin should be a record', async () => {
  type Actual = StateProxy<BasePlugin>
  type Expected = {
    conversation: Record<string, StateRepo<any>>
    user: Record<string, StateRepo<any>>
    bot: Record<string, StateRepo<any>>
    workflow: Record<string, StateRepo<any>>
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.IsExtend<Actual, Expected>,
      utils.IsExtend<Expected, Actual>,
      // // FIXME: uncomment this line to make the test fail
      // utils.IsIdentical<Actual, Expected>,
    ]
  >
})
