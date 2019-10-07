import * as sdk from 'botpress/sdk'
import cluster from 'cluster'
import kmeans from 'ml-kmeans'
import nanoid from 'nanoid'

import { registerMsgHandler } from '../cluster'
const { Tagger, Trainer: CRFTrainer } = require('./crfsuite')
import { FastTextModel } from './fasttext'
import computeJaroWinklerDistance from './homebrew/jaro-winkler'
import computeLevenshteinDistance from './homebrew/levenshtein'
import { processor } from './sentencepiece'
import { Predictor, Trainer as SVMTrainer } from './svm'

const MLToolkit: typeof sdk.MLToolkit = {
  KMeans: {
    kmeans
  },
  CRF: {
    createTagger: Tagger,
    createTrainer: CRFTrainer
  },
  SVM: {
    Predictor,
    Trainer: SVMTrainer
  },
  FastText: { Model: FastTextModel },
  Strings: { computeLevenshteinDistance, computeJaroWinklerDistance },
  SentencePiece: { createProcessor: processor }
}

if (cluster.isWorker) {
  MLToolkit.SVM.Trainer.prototype.train = (
    points: sdk.MLToolkit.SVM.DataPoint[],
    options?: Partial<sdk.MLToolkit.SVM.SVMOptions>,
    progressCb?: sdk.MLToolkit.SVM.TrainProgressCallback | undefined
  ): any => {
    return Promise.fromCallback(completedCb => {
      const messageId = nanoid()
      const messageHandler = msg => {
        if (progressCb && msg.type === 'progress' && msg.id === messageId) {
          progressCb(msg.progress)
        }

        if (msg.type === 'svm_trained' && msg.id === messageId) {
          process.off('message', messageHandler)
          completedCb(undefined, msg.result)
        }
      }

      process.send!({ type: 'svm_train', id: messageId, points, options })
      process.on('message', messageHandler)
    })
  }
}

if (cluster.isMaster) {
  registerMsgHandler('svm_train', async (msg, worker) => {
    const sendToWorker = event => worker.isConnected() && worker.send(event)

    const svm = new SVMTrainer()
    const result = await svm.train(msg.points, msg.options, progress =>
      sendToWorker({ type: 'progress', id: msg.id, progress })
    )

    sendToWorker({ type: 'svm_trained', id: msg.id, result })
  })
}

export default MLToolkit
