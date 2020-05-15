import _ from 'lodash'

var _a = require('mout/array')
var assert = require('assert')
var Q = require('q')
var numeric = require('numeric')

import BaseSVM from './base-svm'
import defaultConfig from './config'

import evaluators from '../evaluators'

import splitDataset from '../util/split-dataset'
import crossCombinations from '../util/cross-combinations'
import { SvmConfig, Data } from '../typings'
import { configToAddonParams } from '../util/options-mapping'

export default function(dataset: Data[], config: SvmConfig) {
  var deferred = Q.defer()
  // default options
  var dims = numeric.dim(dataset)

  assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'dataset must be a list of [X,y] tuples')

  const params = { ...defaultConfig(config) }

  const combs = crossCombinations([
    params.C || [],
    params.gamma || [],
    params.eps || [],
    params.nu || [],
    params.degree || [],
    params.r || []
  ])

  // split dataset for cross-validation
  var subsets = splitDataset(dataset, params.kFold)

  var evaluator = evaluators.getDefault(params)

  var total = combs.length * subsets.length,
    done = 0

  // perform k-fold cross-validation for
  // each combination of parameters
  var promises = combs.map(function(comb) {
    var cParams: SvmConfig = {
      ...params,
      C: comb[0],
      gamma: comb[1],
      eps: comb[2],
      nu: comb[3],
      degree: comb[4],
      r: comb[5]
    }
    var cPromises = subsets.map(function(ss) {
      var clf = new BaseSVM()

      const params = configToAddonParams(cParams)

      return clf
        .train(ss.train, params) // train with train set
        .then(function() {
          // predict values for each example of the test set
          done += 1
          deferred.notify({ done: done, total: total })
          return _a.map(ss.test, function(test) {
            return [clf.predict(test[0]), test[1]]
          })
        })
    })

    return (
      Q.all(cPromises)
        // group all predictions together and compute configuration's accuracy
        // Note : Due to k-fold CV, each example of the dataset has been used for
        //        both training and evaluation but never at the same time
        .then(function(predictions) {
          predictions = _a.flatten(predictions, 1)
          var report = evaluator.compute(predictions)

          return {
            config: cParams,
            report: report
          }
        })
        .fail(function(err) {
          throw err
        })
    )
  })

  Q.all(promises).then(function(results) {
    var best
    if (evaluator === evaluators.classification) {
      best = _a.max(results, function(r) {
        return r.report.fscore
      })
    } else if (evaluator === evaluators.regression) {
      best = _a.min(results, function(r) {
        return r.report.mse
      })
    } else {
      throw new Error('Not implemented')
    }

    deferred.resolve([best.config, best.report])
  })

  return deferred.promise
}
