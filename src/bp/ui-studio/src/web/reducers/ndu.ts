import { Condition, PromptDefinition, Topic } from 'botpress/sdk'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import { conditionsReceived, promptsReceived, receiveQNACountByTopic, topicsReceived } from '~/actions'
import { CountByTopic } from '~/views/OneFlow/sidePanel/TopicList'

export interface NduReducer {
  conditions: Condition[]
  topics: Topic[]
  qnaCountByTopic?: CountByTopic[]
  prompts: PromptDefinition[]
}

const defaultState: NduReducer = {
  conditions: [],
  topics: [],
  qnaCountByTopic: undefined,
  prompts: []
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
    }),
    [promptsReceived]: (state, { payload }) => ({
      ...state,
      prompts: payload
    })
  },
  defaultState
)

export interface NDUReducer {
  conditions: Condition[]
  topics: any[]
  qnaCountByTopic: CountByTopic[]
}
