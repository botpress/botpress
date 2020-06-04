import _ from 'lodash'

const assert = require('assert')

import Q from 'q'
import numeric from 'numeric'

import BaseSVM from './base-svm'
import defaultConfig from './config'

import evaluators from '../evaluators'

import splitDataset from '../util/split-dataset'
import crossCombinations from '../util/cross-combinations'
import { SvmConfig, Data, Report, ClassificationReport, RegressionReport } from '../typings'
import { configToAddonParams } from '../util/options-mapping'
import svmTypes from './svm-types'

export default function(dataset: Data[], config: SvmConfig) {
  const deferred = Q.defer()
  // default options
  const dims = numeric.dim(dataset)

  assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'dataset must be a list of [X,y] tuples')

  config = { ...defaultConfig(config) }

  const arr = (x?: number | number[]) => (x as number[]) || []
  const combs = crossCombinations([
    arr(config.C),
    arr(config.gamma),
    arr(config.p),
    arr(config.nu),
    arr(config.degree),
    arr(config.coef0)
  ])

  // split dataset for cross-validation
  const subsets = splitDataset([...dataset], config.kFold)

  const evaluator = evaluators.getDefault(config)

  const total = combs.length * subsets.length
  let done = 0

  // perform k-fold cross-validation for
  // each combination of parameters
  type Res = { config: SvmConfig; report: Report }
  const promises = combs.map(function(comb) {
    const cParams: SvmConfig = {
      ...config,
      C: comb[0],
      gamma: comb[1],
      p: comb[2],
      nu: comb[3],
      degree: comb[4],
      coef0: comb[5]
    }
    const cPromises = subsets.map(function(ss) {
      const clf = new BaseSVM()

      const params = configToAddonParams(cParams)

      return clf
        .train(ss.train, params) // train with train set
        .then(function() {
          // predict values for each example of the test set
          done += 1
          deferred.notify({ done: done, total: total })
          return _.map(ss.test, function(test) {
            return [clf.predictSync(test[0]), test[1]]
          })
        })
    })

    return (
      Q.all(cPromises)
        // group all predictions together and compute configuration's accuracy
        // Note : Due to k-fold CV, each example of the dataset has been used for
        //        both training and evaluation but never at the same time
        .then(
          p => {
            const predictions = _.flatten(p)
            const report = evaluator.compute(predictions)

            return {
              config: cParams,
              report: report
            } as Res
          },
          err => {
            throw err
          }
        )
    )
  })

  Q.all(promises).then(function(results) {
    let best: Res | undefined
    if (evaluator === evaluators.classification) {
      best = _.maxBy(results, function(r) {
        return (r.report as ClassificationReport).fscore
      })
    } else if (evaluator === evaluators.regression) {
      best = _.minBy(results, function(r) {
        return (r.report as RegressionReport).mse
      })
    } else {
      throw new Error('Not implemented')
    }

    best = best as Res
    deferred.resolve([best.config, best.report])
  })

  return deferred.promise
}
