import assert from 'assert'
import _ from 'lodash'
import numeric from 'numeric'

import { Data } from './typings'

export function normalizeDataset(dataset: Data[], mu?, sigma?) {
  assert(dataset instanceof Array, 'dataset must be an list of [X,y] tuples')
  assert(dataset.length > 0, 'dataset cannot be empty')

  const X = dataset.map(ex => {
      return ex[0]
    }),
    n = numeric.dim(X)[0] || 0,
    m = numeric.dim(X)[1] || 0

  assert(m > 0, 'number of features must be gt 0')

  mu = mu || _.range(m).map(i => _.mean(X.map(x => x[i] || 0)))
  sigma = sigma || _.range(m).map(i => std(X.map(x => x[i] || 0)))

  return {
    dataset: dataset.map(l => [normalizeInput(l[0], mu, sigma), l[1]] as Data),
    mu,
    sigma
  }
}

export function normalizeInput(input: number[], mu: number[], sigma: number[]) {
  assert(input instanceof Array, 'input must be a 1d array')
  assert(mu instanceof Array, 'mu must be a 1d array')
  assert(sigma instanceof Array, 'sigma must be a 1d array')
  const sigmaInv = sigma.map(function(value) {
    return value === 0 ? 1 : 1 / value
  })
  return numeric.mul(numeric.add(input, numeric.neg(mu)), sigmaInv)
}

function std(arr: number[]) {
  const avg = _.mean(arr)
  const constiance = _.reduce(arr, (sum, v) => sum + Math.pow(v - avg, 2), 0) / arr.length
  return Math.pow(constiance, 0.5)
}
