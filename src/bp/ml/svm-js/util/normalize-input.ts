const assert = require('assert')
const mout = require('mout'),
  _a = mout.array
const numeric = require('numeric')
const std = require('./standard-deviation')

export default function(input, mu, sigma) {
  assert(input instanceof Array, 'input must be a 1d array')
  assert(mu instanceof Array, 'mu must be a 1d array')
  assert(sigma instanceof Array, 'sigma must be a 1d array')
  const sigmaInv = sigma.map(function(value) {
    return value === 0 ? 1 : 1 / value
  })
  return numeric.mul(numeric.add(input, numeric.neg(mu)), sigmaInv)
}
