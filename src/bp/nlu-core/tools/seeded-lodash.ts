import _ from 'lodash'
import seedrandom from 'seedrandom'

export const getSeededLodash = (randomSeed?: number | string) => {
  let lo = _
  if (!randomSeed) {
    return lo
  }

  const seed = _.isString(randomSeed) ? parseInt(randomSeed) : randomSeed
  if (seed) {
    seedrandom(`${seed}`, { global: true })
    lo = _.runInContext()
  }
  return lo
}

export const resetSeed = () => {
  seedrandom(`${new Date().getMilliseconds()}`, { global: true })
}
