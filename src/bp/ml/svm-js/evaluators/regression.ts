import { Data } from '../typings'
import BaseSVM from '../core/base-svm'
import _ from 'lodash'

const assert = require('assert')
import numeric from 'numeric'
import average from '../util/average'

function compute(predictions: number[][]) {
  const errors = _.map(predictions, function(p) {
      return p[0] - p[1]
    }),
    avgError = average(errors),
    constiance = average(
      errors.map(function(e) {
        return Math.pow(e - avgError, 2)
      })
    )

  return {
    mse: average(
      errors.map(function(e) {
        return Math.pow(e, 2)
      })
    ),
    std: Math.pow(constiance, 0.5),
    mean: avgError,
    size: predictions.length
  }
}

function evaluate(testSet: Data[], clf: BaseSVM) {
  const dims = numeric.dim(testSet)
  assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'test set must be a list of [X,y] tuples')

  const predictions = testSet.map(function(test) {
    return [clf.predictSync(test[0]), test[1]]
  })
  return compute(predictions)
}

export default {
  evaluate: evaluate,
  compute: compute
}
