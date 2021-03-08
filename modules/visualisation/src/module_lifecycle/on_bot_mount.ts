import * as sdk from 'botpress/sdk'

import bytes from 'bytes'
import { BotState, VisuState } from '../backend/typings'
import { BotpressPredictor } from '../models/botpress_predictor'

export function getOnBotMount(state: VisuState) {
  return async (bp: typeof sdk, botId: string) => {
    state[botId] = {} as BotState
    state[botId].ghost = bp.ghost.forBot(botId)

    // const emb = new BotpressEmbedder(botId, state[botId].ghost)
    // const emb = new PythonEmbedder(state.ghost)
    // state[botId].embedder = emb

    const axiosConfig = await bp.http.getAxiosConfigForBot(botId)
    state[botId].axiosConfig = axiosConfig

    const predictor = new BotpressPredictor(axiosConfig, botId)
    state[botId].predictor = predictor

    const logger = <sdk.NLU.Logger>{
      info: (msg: string) => bp.logger.info(msg),
      warning: (msg: string, err?: Error) => (err ? bp.logger.attachError(err).warn(msg) : bp.logger.warn(msg)),
      error: (msg: string, err?: Error) => (err ? bp.logger.attachError(err).error(msg) : bp.logger.error(msg))
    }
    state[botId].engine = await bp.NLU.makeEngine(
      {
        ducklingURL: 'string',
        ducklingEnabled: false,
        languageSources: [{ endpoint: 'https://lang-01.botpress.io' }],
        modelCacheSize: bytes('800mb')
      },
      logger
    )

    // await state[botId].embedder.load(axiosConfig)
  }
}
