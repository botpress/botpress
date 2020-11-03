import sdk from 'botpress/sdk'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import { trainSessionReceived } from '~/actions'

export interface NLUReducer {
  entities?: sdk.NLU.EntityDefinition[]
  intents?: sdk.NLU.IntentDefinition[]
  trainSession?: sdk.NLU.TrainingSession
}

const defaultState: NLUReducer = {
  trainSession: undefined
}

export default handleActions(
  {
    [trainSessionReceived]: (state, { payload }) => ({
      ...state,
      trainSession: payload
    })
  },
  defaultState
)
