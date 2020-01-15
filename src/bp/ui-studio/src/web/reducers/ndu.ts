import { Condition } from 'botpress/sdk'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import { conditionsReceived, topicsReceived } from '~/actions'

const defaultState = {
  conditions: [],
  topics: []
}

export default handleActions(
  {
    [conditionsReceived]: (state, { payload }) => ({
      ...state,
      conditions: payload
    }),
    [topicsReceived]: (state, { payload }) => ({
      ...state,
      topics: payload
    })
  },
  defaultState
)

export interface NDUReducer {
  conditions: Condition[]
  topics: any[]
}
