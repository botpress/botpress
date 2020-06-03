import * as sdk from 'botpress/sdk'
import nanoid from 'nanoid'

import addon, { Tagger as AddonTagger, Trainer as AddonTrainer, Options } from './addon'

export class Trainer implements Omit<AddonTrainer, 'train'>, sdk.MLToolkit.CRF.Trainer {
  private crfsuite_addon: AddonTrainer

  constructor() {
    this.crfsuite_addon = new addon.Trainer({ debug: true })
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

  trainFromFile(filePath: string) {
    return this.crfsuite_addon.train(filePath)
  }
}

export class Tagger implements sdk.MLToolkit.CRF.Tagger {
  private crfsuite_addon: AddonTagger

  constructor() {
    this.crfsuite_addon = new addon.Tagger()
  }

  tag(xseq: string[][]): { probability: number; result: string[] } {
    return this.crfsuite_addon.tag(xseq)
  }

  open(model_filename: string): boolean {
    return this.crfsuite_addon.open(model_filename)
  }

  marginal(xseq: string[][]): { [label: string]: number }[] {
    return this.crfsuite_addon.marginal(xseq)
  }
}
