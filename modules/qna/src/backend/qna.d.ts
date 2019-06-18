import * as sdk from 'botpress/sdk'

export type Action = 'text' | 'redirect' | 'text_redirect'

export interface QnaEntry {
  action: Action
  category: string
  enabled: boolean
  questions: {
    [lang: string]: string[]
  }
  answers: {
    [lang: string]: string[]
  }
  redirectFlow: string
  redirectNode: string
}

export interface QnaItem {
  id: string
  data: QnaEntry
}
