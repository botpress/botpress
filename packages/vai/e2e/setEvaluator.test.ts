import { beforeAll, describe, expect, test } from 'vitest'
import { setEvaluator } from '../src/hooks/setEvaluator'
import { Context } from '../src/context'

describe('setEvaluator', () => {
  let defaultModel: string

  beforeAll(() => {
    defaultModel = Context.evaluatorModel
  })

  test('defaults', () => {
    expect(Context.evaluatorModel).toBe(defaultModel)
  })

  test('should set the evaluator model', () => {
    setEvaluator('groq__gemma2-9b-it')
    expect(Context.evaluatorModel).toBe('groq__gemma2-9b-it')

    setEvaluator('openai__gpt-4o-mini-2024-07-18')
    expect(Context.evaluatorModel).toBe('openai__gpt-4o-mini-2024-07-18')

    setEvaluator('groq__gemma2-9b-it')
    expect(Context.evaluatorModel).toBe('groq__gemma2-9b-it')
  })

  test('resets after test is done', () => {
    expect(Context.evaluatorModel).toBe(defaultModel)
  })
})
