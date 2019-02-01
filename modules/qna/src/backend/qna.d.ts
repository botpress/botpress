import * as sdk from 'botpress/sdk'

export interface QnaStorage {
  initialize()
  fetchAllQuestions(paging?: sdk.Paging)
  getQuestions({ question, categories }, { limit, offset })
  insert(qna: any, statusCallback?: any)
  update(data: any, id: any): Promise<void>
  delete(id: any, statusCallback?: any): void
  count(): Promise<number>
  answersOn(question)
  getQuestion(opts: any)
  getCategories(): string[]
  hasCategories(): boolean
}
