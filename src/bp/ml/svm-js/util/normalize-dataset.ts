import assert from 'assert'

import numeric from 'numeric'
import normalizeInput from './normalize-input'
import _ from 'lodash'
import { Data } from '../typings'

export default function(dataset: Data[], mu?, sigma?) {
  assert(dataset instanceof Array, 'dataset must be an list of [X,y] tuples')
  assert(dataset.length > 0, 'dataset cannot be empty')

  const X = dataset.map(function(ex) {
      return ex[0]
    }),
    n = numeric.dim(X)[0] || 0,
    m = numeric.dim(X)[1] || 0

  assert(m > 0, 'number of features must be gt 0')

  mu = mu || _.range(m).map(i => _.mean(X.map(x => x[i] || 0)))
  sigma = sigma || _.range(m).map(i => std(X.map(x => x[i] || 0)))

  return {
    dataset: dataset.map(l => [normalizeInput(l[0], mu, sigma), l[1]] as Data),
    mu: mu,
    sigma: sigma
  }
}

function std(arr: number[]) {
  const avg = _.mean(arr)
  const constiance = _.reduce(arr, (sum, v) => sum + Math.pow(v - avg, 2), 0) / arr.length
  return Math.pow(constiance, 0.5)
}
