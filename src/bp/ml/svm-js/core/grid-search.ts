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
import { svmTypes } from '..'

export default function(dataset: Data[], config: SvmConfig) {
  var deferred = Q.defer()
  // default options
  var dims = numeric.dim(dataset)

  assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'dataset must be a list of [X,y] tuples')

  config = { ...defaultConfig(config) }

  const arr = (x?: number | number[]) => (x as number[]) || []
  const combs = crossCombinations([
    arr(config.C),
    arr(config.gamma),
    arr(config.p),
    arr(config.nu),
    arr(config.degree),
    arr(config.r)
  ])

  // split dataset for cross-validation
  var subsets = splitDataset(dataset, config.kFold)

  var evaluator = evaluators.getDefault(config)

  var total = combs.length * subsets.length,
    done = 0

  // perform k-fold cross-validation for
  // each combination of parameters
  var promises = combs.map(function(comb) {
    const cParams: SvmConfig = {
      ...config,
      C: comb[0],
      gamma: comb[1],
      p: comb[2],
      nu: comb[3],
      degree: comb[4],
      r: comb[5]
    }
    var cPromises = subsets.map(function(ss) {
      const clf = new BaseSVM()

      const params = configToAddonParams(cParams)

      // TODO: find a workaround for this supper weird patch.
      // I don't believe this occurs at runtime, but it does in at least one unit test.
      // If so, maybe the splitDataset logic should be modify so training sets are always balanced.
      const n_class = _.uniq(ss.train.map(s => s[1])).length
      params.svm_type = n_class == 1 ? svmTypes['ONE_CLASS'] : params.svm_type

      return clf
        .train(ss.train, params) // train with train set
        .then(function() {
          // predict values for each example of the test set
          done += 1
          deferred.notify({ done: done, total: total })
          return _a.map(ss.test, function(test) {
            return [clf.predictSync(test[0]), test[1]]
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
