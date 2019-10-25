import yn from 'yn'

import { NLUState } from '../index'
const USE_E1 = yn(process.env.USE_LEGACY_NLU)

export function getOnBotUnmount(state: NLUState) {
  return async (bp, botId: string) => {
    delete state.nluByBot[botId]
    if (USE_E1) {
      return
    }

    delete state.e2ByBot[botId]
    state.watchersByBot[botId].remove()
    delete state.watchersByBot[botId]
  }
}
