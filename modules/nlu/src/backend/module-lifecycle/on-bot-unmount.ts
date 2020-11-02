import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { removeTrainingSession } from '../train-session-service'
import { NLUState } from '../typings'

export function getOnBotUnmount(state: NLUState) {
  return async (bp: typeof sdk, botId: string) => {
    const botState = state.nluByBot[botId]
    if (!botState) {
      return
    }

    const activeTrainSession = Object.values(botState.trainSessions ?? {}).filter(
      trainSession => trainSession.status === 'training'
    )

    await Promise.map(activeTrainSession, async ts => {
      await state.broadcastCancelTraining(botId, ts.language)
      await removeTrainingSession(bp, botId, ts)
    })

    state.nluByBot[botId].needsTrainingWatcher.remove()
    delete state.nluByBot[botId]
  }
}
