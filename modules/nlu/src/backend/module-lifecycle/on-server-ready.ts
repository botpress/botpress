import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import makeApi from '../api'
import { getModel } from '../model-service'
import { setTrainingSession } from '../train-session-service'
import { NLUState, TrainingSession } from '../typings'

export function getOnServerReady(state: NLUState) {
  return async (bp: typeof sdk) => {
    const loadModel = async (botId: string, hash: string, language: string) => {
      if (!state.nluByBot[botId]) {
        return
      }

      const ghost = bp.ghost.forBot(botId)
      const model = await getModel(ghost, hash, language)
      if (model) {
        if (state.nluByBot[botId]) {
          await state.nluByBot[botId].engine.loadModel(model)
        } else {
          bp.logger.warn(`Can't load model for unmounted bot ${botId}`)
        }
      }
    }

    const cancelTraining = async (botId: string, language: string) => {
      const trainSession: TrainingSession = _.get(state, `nluByBot.${botId}.trainSessions.${language}`)

      if (trainSession && trainSession.status === 'training') {
        if (trainSession.lock) {
          trainSession.lock.unlock()
        }
        trainSession.status = 'canceled'
        await setTrainingSession(bp, botId, trainSession)
      }
    }

    // @ts-ignore
    state.broadcastLoadModel = await bp.distributed.broadcast(loadModel)
    // @ts-ignore
    state.broadcastCancelTraining = await bp.distributed.broadcast(cancelTraining)
    await makeApi(bp, state)
  }
}
