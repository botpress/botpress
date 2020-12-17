import sdk, { NLU } from 'botpress/sdk'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import { trainSessionReceived } from '~/actions'

export interface NLUReducer {
  entities?: sdk.NLU.EntityDefinition[]
  intents?: sdk.NLU.IntentDefinition[]
  trainSessions: { [lang: string]: sdk.NLU.TrainingSession }
}

const defaultState: NLUReducer = {
  trainSessions: {}
}

export default handleActions(
  {
    [trainSessionReceived]: (state, { payload }) => {
      const trainSession: NLU.TrainingSession = payload
      return {
        ...state,
        trainSessions: {
          ...state.trainSessions,
          [trainSession.language]: trainSession
        }
      }
    }
  },
  defaultState
)
