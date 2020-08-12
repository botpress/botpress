import { Condition, FlowVariableType, PromptDefinition, Topic } from 'botpress/sdk'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import {
  conditionsReceived,
  promptsReceived,
  receiveQNACountByTopic,
  topicsReceived,
  variablesReceived
} from '~/actions'
import { CountByTopic } from '~/views/OneFlow/sidePanel/TopicList'

export interface NduReducer {
  conditions: Condition[]
  topics: Topic[]
  qnaCountByTopic?: CountByTopic[]
  prompts: PromptDefinition[]
  variables: FlowVariableType[]
}

const defaultState: NduReducer = {
  conditions: [],
  topics: [],
  qnaCountByTopic: undefined,
  prompts: [],
  variables: []
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
    }),
    [variablesReceived]: (state, { payload }) => ({
      ...state,
      variables: payload
    })
  },
  defaultState
)

export interface NDUReducer {
  conditions: Condition[]
  topics: any[]
  qnaCountByTopic: CountByTopic[]
}
