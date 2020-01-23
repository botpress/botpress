import sdk from 'botpress/sdk'
import { FlowView } from 'common/typings'

export interface ImportActions {
  type: 'content' | 'action' | 'intent' | 'flow' | 'knowledge' | 'topic'
  name: string
  identical?: boolean
  existing?: boolean
  data?: any
}

export interface ExportedTopic {
  name: string
  description: string
  knowledge: any[]
  goals: ExportedFlow[]
}

interface AdditionalGoalData {
  content: sdk.ContentElement[]
  intents: any[]
  actions: { actionName: string; fileContent: string }[]
  skills: ExportedFlow[]
}

export type ExportedFlow = sdk.Flow & AdditionalGoalData
