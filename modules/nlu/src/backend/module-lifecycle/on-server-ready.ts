import * as sdk from 'botpress/sdk'

import makeApi from '../api'
import { getModel } from '../engine2/model-service'
import { NLUState } from '../typings'

export function getOnServerReady(state: NLUState) {
  return async (bp: typeof sdk) => {
    const loadModel = async (botId: string, hash: string, language: string) => {
      const ghost = bp.ghost.forBot(botId)
      const model = await getModel(ghost, hash, language)
      if (model) {
        await state.nluByBot[botId].engine.loadModel(model)
      }
    }

    state.broadcastLoadModel = await bp.distributed.broadcast(loadModel)
    await makeApi(bp, state)
  }
}
