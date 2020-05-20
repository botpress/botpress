const _a = require('mout/array')
const assert = require('assert')
const numeric = require('numeric')
const average = require('../util/average')

function compute(predictions) {
  const errors = _a.map(predictions, function(p) {
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

function evaluate(testSet, clf) {
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
