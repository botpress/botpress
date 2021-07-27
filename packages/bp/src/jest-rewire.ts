import './jest-before'
import rewire from './sdk/rewire'

export = async () => {
  global.rewire = rewire
}
