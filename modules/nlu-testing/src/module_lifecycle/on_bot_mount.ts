import * as sdk from 'botpress/sdk'

import { BotState, VisuState } from '../backend/typings'
import { BotpressPredictor } from '../models/botpress_predictor'

export function getOnBotMount(state: VisuState) {
  return async (bp: typeof sdk, botId: string) => {
    state[botId] = {} as BotState
    state[botId].ghost = bp.ghost.forBot(botId)

    const axiosConfig = await bp.http.getAxiosConfigForBot(botId)
    state[botId].axiosConfig = axiosConfig
    const predictor = new BotpressPredictor(axiosConfig, botId)
    state[botId].predictor = predictor
    state[botId].botId = botId
    state[botId].language = (await bp.bots.getBotById(botId)).defaultLanguage
  }
}
