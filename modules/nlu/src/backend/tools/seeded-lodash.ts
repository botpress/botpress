import _ from "lodash"
import seedrandom from "seedrandom"

let lo = _

const randomSeed = parseInt(process.env.RANDOM_SEED || "")
if (randomSeed) {
  seedrandom(`${randomSeed}`, { global: true })
  lo = _.runInContext()
  seedrandom(`${new Date().getMilliseconds()}`, { global: true })
}

export default lo