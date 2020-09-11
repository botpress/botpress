import * as sdk from 'botpress/sdk'

import { BotState, VisuState } from '../backend/typings'

export function getOnBotMount(state: VisuState) {
  return async (bp: typeof sdk, botId: string) => {
    state[botId] = {
      ghost: bp.ghost.forBot(botId),
      axiosConfig: await bp.http.getAxiosConfigForBot(botId),
      language: (await bp.bots.getBotById(botId)).defaultLanguage,
      trainDatas: [],
      testDatas: [],
      botId
    } as BotState
  }
}
