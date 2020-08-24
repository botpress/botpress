import * as sdk from 'botpress/sdk'

import { BotState, VisuState } from '../backend/typings'
import { BotpressPredictor } from '../models/botpress_predictor'
import { BotpressEmbedder, PythonEmbedder } from '../models/embedder'

export function getOnBotMount(state: VisuState) {
  return async (bp: typeof sdk, botId: string) => {
    state[botId] = {} as BotState
    state[botId].ghost = bp.ghost.forBot(botId)

    const emb = new BotpressEmbedder(botId, state[botId].ghost)
    // const emb = new PythonEmbedder(state.ghost)
    state[botId].embedder = emb

    const axiosConfig = await bp.http.getAxiosConfigForBot(botId)
    state[botId].axiosConfig = axiosConfig

    const predictor = new BotpressPredictor(axiosConfig, botId)
    state[botId].predictor = predictor

    await state[botId].embedder.load(axiosConfig)
  }
}
