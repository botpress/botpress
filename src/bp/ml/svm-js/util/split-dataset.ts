const assert = require('assert')
import _ from 'lodash'
import { Data } from '../typings'

export default function(dataset: Data[], k = 5): SplittedDataSet[] {
  const kFold = Math.min(dataset.length, k)
  const n = dataset.length

  assert(n >= kFold, 'kFold parameter must be <= n')

  if (kFold === 1) {
    return [
      {
        train: dataset,
        test: dataset
      }
    ]
  }

  const nTestSample = Math.floor(n / kFold)

  let available_test_samples = [...dataset]

  const res: SplittedDataSet[] = []

  for (let i = 0; i < kFold; i++) {
    const test_set = _(available_test_samples)
      .shuffle()
      .take(nTestSample)
      .value()

    available_test_samples = _.remove(available_test_samples, el => test_set.includes(el))
    const train_set = _.difference(dataset, test_set)

    res.push({
      test: test_set,
      train: train_set
    })
  }

  return res
}

type SplittedDataSet = {
  train: Data[]
  test: Data[]
}
