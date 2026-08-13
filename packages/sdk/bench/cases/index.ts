import * as types from '../types.js'
import botAddIntegrationChain10 from './bot-add-integration-chain-10.js'
import control from './control.js'
import extendChain10 from './extend-chain-10.js'
import manyActions30 from './many-actions-30.js'
import realHitlPlugin from './real-hitl-plugin.js'

export const cases = [
  control,
  manyActions30,
  botAddIntegrationChain10,
  extendChain10,
  realHitlPlugin,
] satisfies types.BenchmarkCase[]
