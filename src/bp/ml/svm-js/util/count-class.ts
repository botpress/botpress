import { Data } from '../typings'
import _ from 'lodash'

export function getMostRepresentedClass(dataset: Data[]) {
  const nSamplesPerLabel = countEachClass(dataset)

  const mostRepresentedClass = _(nSamplesPerLabel)
    .toPairs()
    .maxBy(p => p[1])

  const [label, occurence] = mostRepresentedClass as [string, number]

  return {
    label,
    occurence
  }
}

export function getLeastRepresentedClass(dataset: Data[]) {
  const nSamplesPerLabel = countEachClass(dataset)

  const leastRepresentedClass = _(nSamplesPerLabel)
    .toPairs()
    .minBy(p => p[1])

  const [label, occurence] = leastRepresentedClass as [string, number]

  return {
    label,
    occurence
  }
}

function countEachClass(dataset: Data[]) {
  const uniqLabels = _(dataset)
    .map(s => s[1])
    .uniq()
    .value()

  const nSamplesPerLabel = uniqLabels.reduce((o, l) => ({ ...o, [l]: 0 }), {} as { [key: number]: number })
  for (const s of dataset) {
    nSamplesPerLabel[s[1]]++
  }
  return nSamplesPerLabel
}
