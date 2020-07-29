import * as sdk from 'botpress/sdk'

import { VisuState } from '../backend/typings'
import { BotpressPredictor } from '../models/botpress_predictor'
import { BotpressEmbedder, PythonEmbedder } from '../models/embedder'
import { getTrainTestDatas } from '../tools/data_loader'

export function getOnBotMount(state: VisuState) {
  return async (bp: typeof sdk, botId: string) => {
    state.botId = botId
    state.ghost = bp.ghost.forBot(botId)

    const emb = new BotpressEmbedder(botId, state.ghost)
    // const emb = new PythonEmbedder(state.ghost)
    state.embedder = emb

    const axiosConfig = await bp.http.getAxiosConfigForBot(botId)
    state.axiosConfig = axiosConfig

    const predictor = new BotpressPredictor(axiosConfig, botId)
    state.predictor = predictor

    await state.embedder.load(axiosConfig)
    // bp.logger.info('Embedding intents in train and test set')
    // const { train, test } = await getTrainTestDatas(state)
    // bp.logger.info('Done loading datas')
    // state.trainDatas = train
    // state.testDatas = test
  }
}
