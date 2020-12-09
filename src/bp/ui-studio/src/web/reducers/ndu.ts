import { Condition, Topic } from 'botpress/sdk'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import { conditionsReceived, receiveQNACountByTopic, topicsReceived } from '~/actions'
import { CountByTopic } from '~/views/FlowBuilder/sidePanelTopics/TopicList'

export interface NduReducer {
  conditions: Condition[]
  topics: Topic[]
  qnaCountByTopic?: CountByTopic[]
}

const defaultState: NduReducer = {
  conditions: [],
  topics: [],
  qnaCountByTopic: undefined
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
    }),
    [receiveQNACountByTopic]: (state, { payload }) => ({
      ...state,
      qnaCountByTopic: payload
    })
  },
  defaultState
)

export interface NDUReducer {
  conditions: Condition[]
  topics: any[]
  qnaCountByTopic: CountByTopic[]
}
