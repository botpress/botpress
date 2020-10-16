import assert from 'assert'
import _ from 'lodash'
import numeric from 'numeric'

import { Data } from './typings'

export default function(dataset: Data[], retainedVariance: number) {
  retainedVariance = retainedVariance || 0.99
  const dims = numeric.dim(dataset)

  assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'dataset must be an list of [X,y] tuples')
  const inputs = dataset.map(function(ex) {
    return ex[0]
  })
  let covMatrix: number[][] = numeric.dot(numeric.transpose(inputs), inputs) as number[][]
  covMatrix = numeric.mul(covMatrix, numeric.rep(numeric.dim(covMatrix), 1 / inputs.length)) as number[][]
  const usv = numeric.svd(covMatrix)

  const getFirstColumns = (matrix: number[][], nbColumns: number) => {
    return matrix.map((line: number[]) => {
      return _.take(line, nbColumns)
    })
  }
  const n = dims[2]
  let k = dims[2]
  let j = 0
  let retain = 1

  while (true) {
    // decrease k while retain constiance is acceptable
    let num = 0
    let den = 0
    for (j = 0; j < n; j++) {
      if (j < k) {
        num += usv.S[j]
      }
      den += usv.S[j]
    }
    const newRetain = num / den
    if (newRetain < retainedVariance || k === 0) {
      k++
      break
    }
    retain = newRetain
    k--
  }
  const reducedU = getFirstColumns(usv.U, k)

  return {
    U: reducedU,
    oldDimension: n,
    newDimension: k,
    dataset: dataset.map(ex => [numeric.dot(ex[0], reducedU), ex[1]]) as Data[],
    retainedVariance: retain
  }
}
