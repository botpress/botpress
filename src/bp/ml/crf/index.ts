import tmp from 'tmp'
import { MLToolkit } from 'botpress/sdk'

import crfsuite, { Trainer as AddonTrainer, Tagger as AddonTagger } from './addon'

export class Trainer implements MLToolkit.CRF.Trainer {
  private trainer: AddonTrainer

  constructor() {
    // debugging should be enabled but, this slows down crf training... TODO: find a solution
    this.trainer = new crfsuite.Trainer({ debug: false })
  }

  async train(
    elements: MLToolkit.CRF.DataPoint[],
    options: MLToolkit.CRF.TrainerOptions,
    debugCallback?: (msg: string) => void
  ): Promise<string> {
    this.trainer.set_params(options)

    for (const { features, labels } of elements) {
      this.trainer.append(features, labels)
    }

    const crfModelFilename = tmp.fileSync({ postfix: '.bin' }).name

    const emptyCallback = () => {}
    await this.trainer.train_async(crfModelFilename, debugCallback ?? emptyCallback)

    return crfModelFilename
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
