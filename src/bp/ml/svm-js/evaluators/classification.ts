import _ from 'lodash'
import BaseSVM from '../core/base-svm'
import { Data } from '../typings'

const assert = require('assert')

function computeFScore(precision: number, recall: number) {
  if (recall === 0 && precision === 0) {
    return 0
  }
  return (2 * recall * precision) / (recall + precision)
}

function compute(predictions: number[][]) {
  const sumPredicted = {},
    sumExpected = {}

  const classScores = _.reduce(
    predictions,
    function(res, arr) {
      const predicted = arr[0],
        expected = arr[1]

      sumPredicted[predicted] = (sumPredicted[predicted] || 0) + 1.0
      sumExpected[expected] = (sumExpected[expected] || 0) + 1.0
      res[expected] = res[expected] || {}
      res[expected][predicted] = (res[expected][predicted] || 0) + 1.0
      return res
    },
    {}
  )

  const classReports = _.map(classScores, function(scores, label) {
    const tp = scores[label] || 0
    let precision = 0
    let recall = 0
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
  const nbGood = _.reduce(classScores, (sum, scores, label) => sum + (scores[label] || 0), 0)
  return {
    accuracy: nbGood / predictions.length,
    fscore: _.minBy(classReports, function(report) {
      return report.fscore
    })?.fscore,
    recall: _.minBy(classReports, function(report) {
      return report.recall
    })?.recall,
    precision: _.minBy(classReports, function(report) {
      return report.precision
    })?.precision,
    class: classReports,
    size: predictions.length
  }
}

/*
  NOTICE : this function assumes your predictor is already trained
  */
function evaluate(testSet: Data[], clf: BaseSVM) {
  assert(testSet.length > 0, 'test set cannot be empty')
  const predictions: number[][] = testSet.map(test => {
    return [clf.predictSync(test[0]), test[1]]
  })
  return compute(predictions)
}

export default {
  evaluate: evaluate,
  compute: compute
}
