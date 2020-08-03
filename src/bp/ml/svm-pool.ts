import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Trainer } from './svm'

export class SVMTrainingPool {
  private currentSvms: _.Dictionary<Trainer> = {}

  public async startTraining(
    trainingId: string,
    points: sdk.MLToolkit.SVM.DataPoint[],
    options: Partial<sdk.MLToolkit.SVM.SVMOptions>,
    progress: sdk.MLToolkit.SVM.TrainProgressCallback | undefined,
    complete: (model: string) => void,
    error: (error: Error) => void
  ) {
    if (!!this.currentSvms[trainingId]) {
      error(new Error('this exact training was already started'))
      return
    }

    this.currentSvms[trainingId] = new Trainer()
    try {
      const result = await this.currentSvms[trainingId].train(points, options, progress)
      complete(result)
    } catch (err) {
      error(err)
    } finally {
      delete this.currentSvms[trainingId]
    }
  }

  public cancelTraining(trainingId: string) {
    this.currentSvms[trainingId]?.cancelTraining()
    delete this.currentSvms[trainingId]
  }
}
