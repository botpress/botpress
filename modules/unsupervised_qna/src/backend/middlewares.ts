import * as sdk from 'botpress/sdk'
import { Storage } from './storage'

const MAX_PAD = 100

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
      if (answer.score > 0.2) {
        // find start
        const answerStart = corpus.indexOf(answer.text)
        let sentenceStart = answerStart
        let prevFound = false
        while (sentenceStart > 0 && (answerStart - sentenceStart > MAX_PAD || !prevFound)) {
          if (corpus[sentenceStart] === '.' || corpus[sentenceStart] !== corpus[sentenceStart].toLowerCase()) {
            prevFound = true
          }
          sentenceStart--
        }

        // find end
        let sentenceEnd = answerStart + answer.text.length
        let endFound = false
        while (sentenceEnd < corpus.length && (sentenceEnd - answerStart > MAX_PAD || !endFound)) {
          if (corpus[sentenceEnd] === '.') {
            endFound = true
          }
          sentenceEnd++
        }

        const sentence = corpus.slice(sentenceStart, sentenceEnd)
        event.nlu['answer'] = {
          ...answer,
          sentence
        }
      }
      next()
    }
  }

  return mw
}

export default makeMw
