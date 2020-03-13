import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { removeTrainingSession } from '../train-session-service'
import { NLUState, TrainingSession } from '../typings'

export function getOnBotUnmount(state: NLUState) {
  return async (bp: typeof sdk, botId: string) => {
    if (!state.nluByBot[botId]) {
      return
    }

    const activeTrainSession: TrainingSession[] = _.chain(_.get(state.nluByBot[botId], 'trainSessions', {}))
      .values()
      .filter((trainSession: TrainingSession) => trainSession.status === 'training')
      .value()

    await Promise.map(activeTrainSession, async ts => {
      await state.broadcastCancelTraining(botId, ts.language)
      await removeTrainingSession(bp, botId, ts)
    })

    state.nluByBot[botId].trainWatcher.remove()
    delete state.nluByBot[botId]
  }
}
