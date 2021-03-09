import * as sdk from 'botpress/sdk'
import path from 'path'
import { Storage } from './storage'
import { ModuleStatus } from '../typings'

const MAX_PAD = 100

const makeMw = async (storagePerBot: { [botId: string]: Storage }, moduleStatus: ModuleStatus) => {
  const { QAClient, initModel, RuntimeType } = require('question-answering') // do not import at top of file as this breaks on windows

  const inititalizeQAClient = async (): Promise<typeof QAClient> => {
    // This will download the model to every server node in the cluster
    const model = await initModel({
      name: 'distilbert-base-cased-distilled-squad',
      path: path.join(process.APP_DATA_PATH, 'qa-models'),
      runtime: RuntimeType.SavedModel
    })
    moduleStatus.modelLoaded = true
    return QAClient.fromOptions({ model })
  }
  const qaClient = await inititalizeQAClient()

  const mw: sdk.IO.MiddlewareDefinition = {
    name: 'run-unsupervised-qa',
    description: "Runs question answering predict on event's text",
    direction: 'incoming',
    order: 125,
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      const { preview, botId } = event
      if (!storagePerBot[botId]) {
        next()
        return
      }

      const corpus = await storagePerBot[botId].getCorpus()

      const answer = await qaClient.predict(preview, corpus)
      if (answer.score > 0.2) {
        // find start
        const answerStart = corpus.indexOf(answer.text)
        let sentenceStart = answerStart
        let prevFound = false
        while (sentenceStart > 0 && (answerStart - sentenceStart > MAX_PAD || !prevFound)) {
          if (corpus[sentenceStart] === '.') {
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
