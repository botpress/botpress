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

  const nIndexes = _.range(kFold)
  const nbExPerGroup = Math.floor(n / kFold)
  const rest = n % kFold
  let gDelta = 0
  const shuffled = _.chain(dataset).shuffle()

  const sets = nIndexes.map(i => {
    const delta = i < rest ? 1 : 0

    const subset = shuffled
      .drop(i * nbExPerGroup + gDelta)
      .take(nbExPerGroup + delta)
      .value()

    gDelta += delta
    return subset
  })

  return nIndexes.map((a, i, list) => ({
    test: sets[i],
    train: _.chain(list)
      .without(i)
      .map(idx => sets[idx])
      .flatten()
      .value()
  }))
}

type SplittedDataSet = {
  train: Data[]
  test: Data[]
}
