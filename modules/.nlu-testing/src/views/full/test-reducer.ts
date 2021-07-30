import * as sdk from 'botpress/sdk'

import { Test } from '../../shared/typings'

interface TestState {
  utterance: string
  testingCtx: string
  expectedCtx: string
  expectedIntent?: sdk.NLU.IntentDefinition
  slotConditions: _.Dictionary<string>
}

export const TEST_ALL_CTX = '*'
export const NONE_CTX = 'none'
export const NONE_INTENT = {
  name: 'none',
  slots: []
} as sdk.NLU.IntentDefinition

export const DEFAULT_TEST_STATE: TestState = {
  utterance: '',
  testingCtx: TEST_ALL_CTX,
  expectedCtx: NONE_CTX,
  expectedIntent: NONE_INTENT,
  slotConditions: {}
}

export function TestModalReducer(state: TestState, action): TestState {
  const { type, data } = action
  if (type === 'resetState') {
    return { ...DEFAULT_TEST_STATE }
  } else if (type === 'setStateFromTest') {
    const test = data.test as Test
    const utterance = test.utterance
    const testingCtx = test.context

    const ctxCondition = test.conditions.find(([key]) => key === 'context')
    const intentCondition = test.conditions.find(([key]) => key === 'intent')

    const expectedCtx = testingCtx === TEST_ALL_CTX ? ctxCondition[2] : undefined
    const expectedIntent = intentCondition ? data.intents.find(i => i.name === intentCondition[2]) : undefined
    const slotConditions = test.conditions
      .filter(([key]) => key.startsWith('slot'))
      .reduce((slotsDic, [key, is, slotValue]) => {
        const slotName = key.split(':')[1]
        slotsDic[slotName] = slotValue
        return slotsDic
      }, {})

    return {
      utterance,
      testingCtx,
      expectedCtx,
      expectedIntent,
      slotConditions
    }
  } else if (type === 'setUtterance') {
    return { ...state, utterance: data.utterance }
  } else if (type === 'setTesingCtx') {
    return { ...state, testingCtx: data.testingCtx }
  } else if (type === 'setExpectedCtx') {
    return { ...state, expectedCtx: data.expectedCtx, expectedIntent: NONE_INTENT, slotConditions: {} }
  } else if (type === 'setExpectedIntent') {
    return { ...state, expectedIntent: data.expectedIntent, slotConditions: {} }
  } else if (type === 'setSlotCondition') {
    return { ...state, slotConditions: { ...state.slotConditions, [data.slotName]: data.slotValue } }
  } else {
    return state
  }
}
