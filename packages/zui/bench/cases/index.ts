import * as types from '../types.js'
import control from './control.js'
import extendChain10 from './extend-chain-10.js'
import extendChain25 from './extend-chain-25.js'
import manyObjects50 from './many-objects-50.js'
import pickOmitChain10 from './pick-omit-chain-10.js'
import realWhatsapp from './real-whatsapp.js'

export const cases = [
  control,
  extendChain10,
  extendChain25,
  manyObjects50,
  pickOmitChain10,
  realWhatsapp,
] satisfies types.BenchmarkCase[]
