import { test } from 'vitest'
import type { EmptyBot, FooBarBazBot } from '../../fixtures'
import type { WorkflowProxy } from './types'
import type * as typeUtils from '../../utils/type-utils'
import type { BaseBot } from '../common'

test('WorkflowProxy of FooBarBazBot should reflect workflows of bot', async () => {
  type Actual = WorkflowProxy<FooBarBazBot>
  type Expected = Readonly<{
    fooWorkflow: {
      startNewInstance: (x: any) => any
      listInstances: {
        all: (x: any) => any
        running: (x: any) => any
        scheduled: (x: any) => any
        allFinished: (x: any) => any
        succeeded: (x: any) => any
        cancelled: (x: any) => any
        timedOut: (x: any) => any
        failed: (x: any) => any
      }
    }
  }>

  type _assertion = typeUtils.AssertAll<
    [
      //
      typeUtils.IsExtend<Actual, Expected>,
      typeUtils.IsExtend<Expected, Actual>,
      typeUtils.IsEquivalent<Actual, Expected>,
    ]
  >
})

test('WorkflowProxy of EmptyBot should be almost empty', async () => {
  type Actual = WorkflowProxy<EmptyBot>
  type Expected = {}

  type _assertion = typeUtils.AssertAll<
    [
      //
      typeUtils.IsExtend<Actual, Expected>,
      typeUtils.IsExtend<Expected, Actual>,
      typeUtils.IsEquivalent<Actual, Expected>,
    ]
  >
})

test('WorkflowProxy of BaseBot should be a record', async () => {
  type Actual = WorkflowProxy<BaseBot>
  type Expected = {
    [x: string]: {
      startNewInstance: (x: any) => any
      listInstances: {
        all: (x: any) => any
        running: (x: any) => any
        scheduled: (x: any) => any
        allFinished: (x: any) => any
        succeeded: (x: any) => any
        cancelled: (x: any) => any
        timedOut: (x: any) => any
        failed: (x: any) => any
      }
    }
  }
  type _assertion = typeUtils.AssertAll<
    [
      //
      typeUtils.IsExtend<Actual, Expected>,
      typeUtils.IsExtend<Expected, Actual>,
      typeUtils.IsEquivalent<Actual, Expected>,
    ]
  >
})
