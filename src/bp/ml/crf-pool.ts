import * as sdk from 'botpress/sdk'
import { Trainer } from './crf'

export class CRFTrainingPool {
  private currentCrfs: _.Dictionary<Trainer> = {}

  public async startTraining(
    trainingId: string,
    elements: sdk.MLToolkit.CRF.DataPoint[],
    options: sdk.MLToolkit.CRF.TrainerOptions,
    progress: (iteration: number) => void,
    complete: (modelFilePath: string) => void,
    error: (error: Error) => void
  ) {
    if (!!this.currentCrfs[trainingId]) {
      error(new Error('this exact crf training was already started'))
    }

    this.currentCrfs[trainingId] = new Trainer()
    try {
      const result = await this.currentCrfs[trainingId].train(elements, options, progress)
      complete(result)
    } catch (err) {
      error(err)
    } finally {
      delete this.currentCrfs[trainingId]
    }
  }

  public cancelTraining(trainingId: string) {
    this.currentCrfs[trainingId]?.cancelTraining()
    delete this.currentCrfs[trainingId]
  }
}
