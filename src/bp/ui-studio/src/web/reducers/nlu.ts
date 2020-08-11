import sdk from 'botpress/sdk'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import { entitiesReceived, intentsReceived } from '~/actions'

export interface NLUReducer {
  entities?: sdk.NLU.EntityDefinition[]
  intents?: sdk.NLU.IntentDefinition[]
}

const defaultState: NLUReducer = {
  entities: undefined,
  intents: undefined
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
    })
  },
  defaultState
)
