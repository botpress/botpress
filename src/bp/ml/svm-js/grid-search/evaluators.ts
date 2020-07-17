import _ from 'lodash'

import svmTypes from '../svm-types'
import { SvmConfig, ClassificationReport, RegressionReport, Report } from '../typings'

import { GridSearchResult } from './typings'

class ClassificationEvaluator implements Evaluator {
  public electBest(results: GridSearchResult[]): GridSearchResult {
    if (!results.length) {
      throw new Error('best result election needs at least one result')
    }
    return <GridSearchResult>_.minBy(results, r => (r.report as ClassificationReport).fscore)
  }

  public compute = (predictions: number[][]): ClassificationReport => {
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

    const classReports = _.map(classScores, (scores, label) => {
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
        fscore: this.computeFScore(precision, recall),
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

  private computeFScore(precision: number, recall: number) {
    if (recall === 0 && precision === 0) {
      return 0
    }
    return (2 * recall * precision) / (recall + precision)
  }
}

class RegressionEvaluator implements Evaluator {
  public electBest(results: GridSearchResult[]): GridSearchResult {
    if (!results.length) {
      throw new Error('best result election needs at least one result')
    }
    return <GridSearchResult>_.minBy(results, r => (r.report as RegressionReport).mse)
  }

  public compute(predictions: number[][]): RegressionReport {
    const errors = _.map(predictions, function(p) {
        return p[0] - p[1]
      }),
      avgError = _.mean(errors),
      constiance = _.mean(
        errors.map(function(e) {
          return Math.pow(e - avgError, 2)
        })
      )

    return {
      mse: _.mean(
        errors.map(function(e) {
          return Math.pow(e, 2)
        })
      ),
      std: Math.pow(constiance, 0.5),
      mean: avgError,
      size: predictions.length
    }
  }
}

interface Evaluator {
  compute(predictions: number[][]): Report
  electBest(results: GridSearchResult[]): GridSearchResult
}

export default function(config: SvmConfig): Evaluator {
  switch (config.svm_type) {
    case svmTypes.C_SVC:
    case svmTypes.NU_SVC:
    case svmTypes.ONE_CLASS:
      return new ClassificationEvaluator()
    case svmTypes.EPSILON_SVR:
    case svmTypes.NU_SVR:
      return new RegressionEvaluator()
    default:
      throw new Error('No evaluator found for given configuration')
  }
}
