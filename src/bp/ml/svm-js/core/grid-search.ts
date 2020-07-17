import _ from 'lodash'

import assert from 'assert'

import numeric from 'numeric'
import evaluators from '../evaluators'
import splitDataset from '../util/split-dataset'
import crossCombinations from '../util/cross-combinations'
import { SvmConfig, Data, Report, ClassificationReport, RegressionReport, SvmParameters } from '../typings'

import BaseSVM from './base-svm'
import { defaultParameters } from './config'

type Progress = {
  done: number
  total: number
}

type Res = { params: SvmParameters; report: Report }

export default async function(
  dataset: Data[],
  config: SvmConfig,
  progressCb: (progress: Progress) => void
): Promise<Res> {
  const dims = numeric.dim(dataset)

  assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'dataset must be a list of [X,y] tuples')

  const arr = (x?: number | number[]) => (x as number[]) || []
  const combs = crossCombinations([
    arr(config.C),
    arr(config.gamma),
    arr(config.p),
    arr(config.nu),
    arr(config.degree),
    arr(config.coef0)
  ])

  const subsets = splitDataset([...dataset], config.kFold)

  const evaluator = evaluators.getDefault(config)

  const total = combs.length * subsets.length
  let done = 0

  const promises = combs.map(comb => {
    const params = defaultParameters({
      ...config,
      C: comb[0],
      gamma: comb[1],
      p: comb[2],
      nu: comb[3],
      degree: comb[4],
      coef0: comb[5]
    })

    const cPromises = subsets.map(function(ss) {
      const clf = new BaseSVM()

      return clf
        .train(ss.train, params) // train with train set
        .then(function() {
          // predict values for each example of the test set
          done += 1
          progressCb({ done: done, total: total })
          return _.map(ss.test, function(test) {
            return [clf.predictSync(test[0]), test[1]]
          })
        })
    })

    return Promise.all(cPromises).then(
      p => {
        const predictions = _.flatten(p)
        const report = evaluator.compute(predictions)

        return {
          params,
          report: report
        } as Res
      },
      err => {
        throw err
      }
    )
  })

  const results = await Promise.all(promises)
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

  return best as Res
}
