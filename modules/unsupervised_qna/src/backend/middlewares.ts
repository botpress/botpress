import * as sdk from 'botpress/sdk'
import { Storage } from './storage'

const makeMw = (storagePerBot: { [botId: string]: Storage }) => {
  const mw: sdk.IO.MiddlewareDefinition = {
    name: 'run_unsupervised_qna',
    description: "runs question answering predict on event's text",
    direction: 'incoming',
    order: 125,
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      const { preview, botId } = event
      if (!storagePerBot[botId]) {
        next()
        return
      }

      const { QAClient } = require('question-answering')

      const corpus = await storagePerBot[botId].getCorpus()

      const qaClient = await QAClient.fromOptions()
      const answer = await qaClient.predict(preview, corpus)

      event.nlu['answer'] = answer
      next()
    }
  }

  return mw
}

export default makeMw
