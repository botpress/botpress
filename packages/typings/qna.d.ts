type QnaAction = 'text' | 'redirect' | 'text_redirect'

export interface QnaEntry {
  action: QnaAction
  contexts: string[]
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
  isNew?: boolean
  key?: string
  saveError?: string
  data: QnaEntry
}
