import * as sdk from 'botpress/sdk'

export interface QnaStorage {
  initialize()
  fetchAllQuestions(paging?: sdk.Paging)
  getQuestions({ question, categories }, { limit, offset })
  insert(qna: QnaEntry, statusCallback?: any)
  update(data: QnaEntry, id: string): Promise<string>
  delete(id: string, statusCallback?: any): void
  count(): Promise<number>
  answersOn(question)
  getQuestion(opts: any)
  getCategories(): string[]
  hasCategories(): boolean
}

export type Action = 'text' | 'redirect' | 'text_redirect'

export interface QnaEntry {
  action: Action
  category: string
  enabled: boolean
  questions: string[]
  answers: string[]
  redirectFlow: string
  redirectNode: string
}
