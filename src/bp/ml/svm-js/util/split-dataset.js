'use strict'

var assert = require('assert')
var _ = require('lodash')

module.exports = function(dataset, kFold) {
  kFold = kFold || 5

  var n = dataset.length,
    nIndexes = _.range(kFold),
    nbExPerGroup = Math.floor(n / kFold),
    rest = n % kFold,
    gDelta = 0

  assert(n >= kFold, 'kFold parameter must be <= n')
  var shuffled = _.shuffle(dataset)

  if (kFold === 1) {
    return [
      {
        train: dataset,
        test: dataset
      }
    ]
  }

  var sets = _.map(nIndexes, function(i) {
    var delta = i < rest ? 1 : 0
    var subset = _.chain(shuffled)
      .drop(i * nbExPerGroup + gDelta)
      .take(nbExPerGroup + delta)
      .value()
    gDelta += delta
    return subset
  })

  return _(nIndexes).map(function(a, i, list) {
    return {
      test: sets[i],
      train: _.chain(list)
        .without(i)
        .map(function(iii) {
          return sets[iii]
        })
        .flatten()
        .value()
    }
  })
}
