import sdk from 'botpress/sdk'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import { entitiesReceived, intentsReceived, trainSessionReceived } from '~/actions'

export interface NLUReducer {
  entities?: sdk.NLU.EntityDefinition[]
  intents?: sdk.NLU.IntentDefinition[]
  trainSession?: sdk.NLU.TrainingSession
}

const defaultState: NLUReducer = {
  entities: undefined,
  intents: undefined,
  trainSession: undefined
}

export default handleActions(
  {
    [intentsReceived]: (state, { payload }) => ({
      ...state,
      intents: payload
    }),

    [entitiesReceived]: (state, { payload }) => ({
      ...state,
      entities: payload
    }),

    [trainSessionReceived]: (state, { payload }) => ({
      ...state,
      trainSession: payload
    })
  },
  defaultState
)
