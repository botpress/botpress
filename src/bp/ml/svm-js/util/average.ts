import _ from 'lodash'

import assert from 'assert'
import numeric from 'numeric'

export default function(arr: number[]) {
  const n = numeric.dim(arr)[0] || 0
  assert(n > 0, 'array cannot be empty')
  return _.reduce(arr, (sum, v) => sum + v, 0) / n
}
