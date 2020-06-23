import assert from 'assert'
import numeric from 'numeric'
import average from './average'
import _ from 'lodash'

export default function(arr: number[]) {
  const n = numeric.dim(arr)[0] || 0
  const m = numeric.dim(arr)[1] || 0
  assert(n > 0, 'array cannot be empty')
  assert(m === 0, 'array must be 1d')
  const avg = average(arr)
  const constiance = _.reduce(arr, (sum, v) => sum + Math.pow(v - avg, 2), 0) / n
  return Math.pow(constiance, 0.5)
}
