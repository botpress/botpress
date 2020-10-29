import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import kmeans from 'ml-kmeans'
import nanoid from 'nanoid'

import { Tagger } from './crf'
import { FastTextModel } from './fasttext'
import { MLThreadPool } from './ml-thread-pool'
import { processor } from './sentencepiece'
import { Predictor } from './svm'

const workerPool = new MLThreadPool()
class MultiThreadedSVM implements sdk.MLToolkit.SVM.Trainer {
  train(
    points: sdk.MLToolkit.SVM.DataPoint[],
    options?: sdk.MLToolkit.SVM.SVMOptions,
    progressCb?: sdk.MLToolkit.SVM.TrainProgressCallback
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const id = nanoid()
      await workerPool.startSvmTraining(id, points, options, progressCb, resolve, reject)
    })
  }
}

class MultiThreadedCRF implements sdk.MLToolkit.CRF.Trainer {
  train(
    elements: sdk.MLToolkit.CRF.DataPoint[],
    params: sdk.MLToolkit.CRF.TrainerOptions,
    progressCb?: sdk.MLToolkit.CRF.TrainProgressCallback
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const id = nanoid()
      await workerPool.startCrfTraining(id, elements, params, progressCb, resolve, reject)
    })
  }
}

const MLToolkit: typeof sdk.MLToolkit = {
  KMeans: {
    kmeans
  },
  CRF: {
    Tagger,
    Trainer: MultiThreadedCRF
  },
  SVM: {
    Predictor,
    Trainer: MultiThreadedSVM
  },
  FastText: { Model: FastTextModel },
  SentencePiece: { createProcessor: processor }
}

export default MLToolkit
