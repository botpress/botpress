import { getCurrentTest } from 'vitest/suite'
import { EvaluatorModel, TestMetadata } from '../context'

export const setEvaluator = (model: EvaluatorModel) => {
  const test = getCurrentTest()

  if (!test) {
    throw new Error('setEvaluator is a Vitest hook and must be called within a test')
  }

  const meta = test.meta as TestMetadata
  meta.evaluatorModel = model
}
