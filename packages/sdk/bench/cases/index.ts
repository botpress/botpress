import * as types from '../types.js'
import botHandlersScale30 from './bot-handlers-scale-30.js'
import control from './control.js'
import manyActions30 from './many-actions-30.js'
import realHitlPlugin from './real-hitl-plugin.js'

export const cases = [control, manyActions30, realHitlPlugin, botHandlersScale30] satisfies types.BenchmarkCase[]
