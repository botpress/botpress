'use strict'

var mout = require('mout'),
  _a = mout.array,
  _o = mout.object
var assert = require('assert')

function computeFScore(precision, recall) {
  if (recall === 0 && precision === 0) {
    return 0
  }
  return (2 * recall * precision) / (recall + precision)
}

function compute(predictions) {
  var sumPredicted = {},
    sumExpected = {}

  var classScores = _a.reduce(
    predictions,
    function(res, arr) {
      var predicted = arr[0],
        expected = arr[1]

      sumPredicted[predicted] = (sumPredicted[predicted] || 0) + 1.0
      sumExpected[expected] = (sumExpected[expected] || 0) + 1.0
      res[expected] = res[expected] || {}
      res[expected][predicted] = (res[expected][predicted] || 0) + 1.0
      return res
    },
    {}
  )

  var classReports = _o.map(classScores, function(scores, label) {
    var tp = scores[label] || 0,
      precision = 0,
      recall = 0
    if (tp !== 0) {
      precision = tp / sumPredicted[label]
      recall = tp / sumExpected[label]
    }
    return {
      precision: precision,
      recall: recall,
      fscore: computeFScore(precision, recall),
      size: sumExpected[label]
    }
  })
  var nbGood = _o.reduce(
    classScores,
    function(sum, scores, label) {
      return sum + (scores[label] || 0)
    },
    0
  )
  return {
    accuracy: nbGood / predictions.length,
    fscore: _o.min(classReports, function(report) {
      return report.fscore
    }).fscore,
    recall: _o.min(classReports, function(report) {
      return report.recall
    }).recall,
    precision: _o.min(classReports, function(report) {
      return report.precision
    }).precision,
    class: classReports,
    size: predictions.length
  }
}
/**
 NOTICE : this function assumes your predictor is already trained
 */
function evaluate(testSet, clf) {
  assert(testSet.length > 0, 'test set cannot be empty')
  var predictions = testSet.map(function(test) {
    return [clf.predictSync(test[0]), test[1]]
  })
  return compute(predictions)
}

module.exports = {
  evaluate: evaluate,
  compute: compute
}
