import _ from "lodash"
import seedrandom from "seedrandom"

seedrandom("seed", { global: true })
const lo = _.runInContext()
seedrandom(`${new Date().getMilliseconds()}`, { global: true })

export default lo