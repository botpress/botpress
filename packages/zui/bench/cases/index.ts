import * as types from '../types'
import control from './control'
import extendChain10 from './extend-chain-10'
import extendChain25 from './extend-chain-25'
import manyObjects50 from './many-objects-50'
import pickOmitChain10 from './pick-omit-chain-10'
import realWhatsapp from './real-whatsapp'

export const cases = [
  control,
  extendChain10,
  extendChain25,
  manyObjects50,
  pickOmitChain10,
  realWhatsapp,
] satisfies types.BenchmarkCase[]
