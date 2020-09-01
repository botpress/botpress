import * as sdk from 'botpress/sdk'

import { BotState, VisuState } from '../backend/typings'

export function getOnBotMount(state: VisuState) {
  return async (bp: typeof sdk, botId: string) => {
    state[botId] = {} as BotState
    state[botId].ghost = bp.ghost.forBot(botId)

    const axiosConfig = await bp.http.getAxiosConfigForBot(botId)
    state[botId].axiosConfig = axiosConfig
    state[botId].botId = botId
    state[botId].language = (await bp.bots.getBotById(botId)).defaultLanguage
  }
}
