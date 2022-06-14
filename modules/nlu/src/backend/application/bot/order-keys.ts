import _ from 'lodash'

export const orderKeys = <T>(x: T): T => {
  if (typeof x !== 'object') {
    return x
  }

  for (const k in x) {
    x[k] = orderKeys(x[k])
  }

  if (_.isArray(x)) {
    return x
  }

  return _(x)
    .toPairs()
    .sortBy(0)
    .fromPairs()
    .value() as T
}
