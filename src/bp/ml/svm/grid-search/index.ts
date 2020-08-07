import _ from 'lodash'
import assert from 'assert'
import numeric from 'numeric'

import splitDataset from './split-dataset'
import crossCombinations from './cross-combinations'
import { SvmConfig, Data } from '../typings'
import BaseSVM from '../addon'
import { defaultParameters } from '../config'

import evaluators from './evaluators'
import { GridSearchResult, GridSearchProgress } from './typings'

export default async function(
  dataset: Data[],
  config: SvmConfig,
  progressCb: (progress: GridSearchProgress) => void
): Promise<GridSearchResult> {
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

  const evaluator = evaluators(config)

  if (combs.length === 1) {
    progressCb({ done: 1, total: 1 })
    const comb = combs[0]
    const params = defaultParameters({
      ...config,
      C: comb[0],
      gamma: comb[1],
      p: comb[2],
      nu: comb[3],
      degree: comb[4],
      coef0: comb[5]
    })
    return { params }
  }

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

      return clf.train(ss.train, params).then(() => {
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
        } as GridSearchResult
      },
      err => {
        throw err
      }
    )
  })

  const results = await Promise.all(promises)
  return evaluator.electBest(results)
}
