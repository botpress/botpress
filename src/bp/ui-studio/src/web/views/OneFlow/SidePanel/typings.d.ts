import sdk from 'botpress/sdk'

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
  goals: any[]
}

interface AdditionalGoalData {
  content: sdk.ContentElement[]
  intents: any[]
  actions: { actionName: string; fileContent: string }[]
  skills: ExportedFlow[]
}

export type ExportedFlow = sdk.Flow & AdditionalGoalData
