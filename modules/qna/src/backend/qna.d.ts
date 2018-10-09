import * as sdk from 'botpress/sdk'

export type SDK = typeof sdk

export interface QnaStorage {
  initialize()
  all(paging?: sdk.Paging)
  insert(qna: any)
  update(data: any, id: any)
  delete(id: any): void
  count(): any
  answersOn(question)
  getQuestion(opts: any)
}
