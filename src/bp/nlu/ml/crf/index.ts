import { MLToolkit } from 'botpress/sdk'
import tmp from 'tmp'

import crfsuite, { Tagger as AddonTagger, Trainer as AddonTrainer } from './addon'

export class Trainer implements MLToolkit.CRF.Trainer {
  private trainer: AddonTrainer
  private _cancelTraining = false

  constructor() {
    // debugging should be enabled but, this slows down crf training... TODO: find a solution
    this.trainer = new crfsuite.Trainer({ debug: false })
  }

  public async train(
    elements: MLToolkit.CRF.DataPoint[],
    options: MLToolkit.CRF.TrainerOptions,
    progressCallback?: (iteration: number) => void
  ): Promise<string> {
    this.trainer.set_params(options)

    for (const { features, labels } of elements) {
      this.trainer.append(features, labels)
    }

    const crfModelFilename = tmp.fileSync({ postfix: '.bin' }).name

    this.trainer.train(crfModelFilename, iteration => {
      progressCallback && progressCallback(iteration)
      return this._cancelTraining ? 1 : 0
    })

    return crfModelFilename
  }

  public cancelTraining() {
    this._cancelTraining = true
  }
}

export class Tagger implements MLToolkit.CRF.Tagger {
  private tagger: AddonTagger

  constructor() {
    this.tagger = new crfsuite.Tagger()
  }

  tag(xseq: string[][]): { probability: number; result: string[] } {
    return this.tagger.tag(xseq)
  }

  open(model_filename: string): boolean {
    return this.tagger.open(model_filename)
  }

  marginal(xseq: string[][]): { [label: string]: number }[] {
    return this.tagger.marginal(xseq)
  }
}
