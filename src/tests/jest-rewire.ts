import './jest-before'
import rewire from '../bp/sdk/rewire'

export = async () => {
  global.rewire = rewire
}
