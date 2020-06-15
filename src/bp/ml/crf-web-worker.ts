import nanoid from 'nanoid'
import * as sdk from 'botpress/sdk'
import crfsuite, { Trainer as CRFTrainer, Options } from './crfsuite'

/**
 * This is only a wrapper class over the binding to respect the sdk interface
 */
export class WebWorkerCrfTrainer implements Omit<CRFTrainer, 'train'>, sdk.MLToolkit.CRF.Trainer {
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

  train(elements: sdk.MLToolkit.CRF.DataPoint[], params: sdk.MLToolkit.CRF.TrainerOptions): Promise<string> {
    const ret: any = Promise.fromCallback(completedCb => {
      const id = nanoid()
      const messageHandler = msg => {
        if (msg.id !== id) {
          return
        }

        if (msg.type === 'crf_done') {
          completedCb(undefined, msg.payload.crfModelFilename)
          process.off('message', messageHandler)
        }

        if (msg.type === 'crf_error') {
          completedCb(msg.payload.error)
          process.off('message', messageHandler)
        }
      }

      process.send!({ type: 'crf_train', id, payload: { elements, params } })
      process.on('message', messageHandler)
    })
    return ret as Promise<string> // Bluebird promise to promise does not build...
  }
}
