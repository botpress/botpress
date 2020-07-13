import * as sdk from 'botpress/sdk'
import crfsuite, { Trainer as CRFTrainer, Options } from './crfsuite'
import tmp from 'tmp'

export class CrfTrainer implements Omit<CRFTrainer, 'train'>, sdk.MLToolkit.CRF.Trainer {
  private crfsuite_addon: CRFTrainer

  constructor() {
    this.crfsuite_addon = new crfsuite.Trainer({ debug: true })
  }

  append(xseq: string[][], yseq: string[]): void {
    return this.crfsuite_addon.append(xseq, yseq)
  }

  train_async(model_filename: string, cb: (s: string) => void): Promise<number> {
    return this.crfsuite_addon.train_async(model_filename, cb)
  }

  get_params(options: Options) {
    return this.crfsuite_addon.get_params(options)
  }

  set_params(options: Options): void {
    return this.crfsuite_addon.set_params(options)
  }

  async train(elements: sdk.MLToolkit.CRF.DataPoint[], params: sdk.MLToolkit.CRF.TrainerOptions): Promise<string> {
    const debugTrain = DEBUG('nlu').sub('training')
    const trainer = new crfsuite.Trainer()

    try {
      trainer.set_params(params)

      for (const { features, labels } of elements) {
        trainer.append(features, labels)
      }

      const crfModelFilename = tmp.fileSync({ postfix: '.bin' }).name
      await trainer.train_async(crfModelFilename, str => debugTrain('CRFSUITE', str))

      return crfModelFilename
    } catch (error) {
      return error
    }
  }
}
