import * as sdk from 'botpress/sdk'
import cluster from 'cluster'
import _ from 'lodash'
import kmeans from 'ml-kmeans'
import nanoid from 'nanoid'

import { WORKER_TYPES } from '../cluster'

import { Tagger, Trainer as CRFTrainer } from './crf'
import { FastTextModel } from './fasttext'
import computeJaroWinklerDistance from './homebrew/jaro-winkler'
import computeLevenshteinDistance from './homebrew/levenshtein'
import { MLWorkerPool } from './ml-worker-pool'
import { processor } from './sentencepiece'
import { Predictor, Trainer as SVMTrainer } from './svm'

const MLToolkit: typeof sdk.MLToolkit = {
  KMeans: {
    kmeans
  },
  CRF: {
    Tagger: Tagger,
    Trainer: CRFTrainer
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
  // WEB or TRAINING worker, I don't mind...
  const workerPool = new MLWorkerPool()

  MLToolkit.SVM.Trainer.prototype.train = (
    points: sdk.MLToolkit.SVM.DataPoint[],
    options?: Partial<sdk.MLToolkit.SVM.SVMOptions>,
    progressCb?: sdk.MLToolkit.SVM.TrainProgressCallback | undefined
  ): any => {
    return new Promise((resolve, reject) => {
      const id = nanoid()
      workerPool.startSvmTraining(id, points, options ?? {}, progressCb, resolve, reject)
    })
  }

  MLToolkit.CRF.Trainer.prototype.train = (
    elements: sdk.MLToolkit.CRF.DataPoint[],
    params: sdk.MLToolkit.CRF.TrainerOptions,
    progressCb?: (iteration: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const id = nanoid()
      workerPool.startCrfTraining(id, elements, params, progressCb, resolve, reject)
    })
  }
}
export default MLToolkit
