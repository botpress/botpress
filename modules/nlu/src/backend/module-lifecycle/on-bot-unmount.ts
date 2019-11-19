import { NLUState } from '../typings'

export function getOnBotUnmount(state: NLUState) {
  return async (_, botId: string) => {
    if (!state.nluByBot[botId]) {
      return
    }
    state.nluByBot[botId].trainWatcher.remove()
    delete state.nluByBot[botId]
  }
}
