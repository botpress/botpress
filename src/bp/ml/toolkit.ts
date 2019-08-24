import * as sdk from 'botpress/sdk'
import cluster from 'cluster'

const { Tagger, Trainer: CRFTrainer } = require('./crfsuite')
import { FastTextModel } from './fasttext'
import computeJaroWinklerDistance from './homebrew/jaro-winkler'
import computeLevenshteinDistance from './homebrew/levenshtein'
import { processor } from './sentencepiece'
import { Predictor, Trainer as SVMTrainer } from './svm'

const MLToolkit: typeof sdk.MLToolkit = {
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

if (cluster.isMaster) {
  MLToolkit.SVM.Trainer.prototype.train = (
    points: sdk.MLToolkit.SVM.DataPoint[],
    callback?: sdk.MLToolkit.SVM.TrainProgressCallback | undefined,
    options?: Partial<sdk.MLToolkit.SVM.SVMOptions>
  ): any => {
    return Promise.fromCallback(cb => {
      const worker = cluster.workers[1]!

      const messageHandler = msg => {
        if (callback && msg.type === 'progress') {
          callback(msg.progress)
        }

        if (msg.type === 'svm_trained') {
          worker.off('message', messageHandler)
          cb(undefined, msg.result)
        }
      }

      worker.send({ type: 'svm_train', points, options })
      worker.on('message', messageHandler)
    })
  }
}

if (cluster.isWorker) {
  process.on('message', async msg => {
    if (msg.type === 'svm_train') {
      const svm = new SVMTrainer(msg.options)
      const result = await svm.train(msg.points, progress => process.send!({ type: 'progress', progress }))
      process.send!({ type: 'svm_trained', result })
    }
  })
}

export default MLToolkit
