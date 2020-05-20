import assert from 'assert'
import _a from 'mout/array'
import numeric from 'numeric'
import average from './average'

export default function(arr) {
  const n = numeric.dim(arr)[0] || 0
  const m = numeric.dim(arr)[1] || 0
  assert(n > 0, 'array cannot be empty')
  assert(m === 0, 'array must be 1d')
  const avg = average(arr)
  const constiance =
    _a.reduce(
      arr,
      function(sum, v) {
        return sum + Math.pow(v - avg, 2)
      },
      0
    ) / n
  return Math.pow(constiance, 0.5)
}
