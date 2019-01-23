import * as sdk from 'botpress/sdk'
import { createWriteStream, readFileSync, writeFileSync } from 'fs'
import _ from 'lodash'
import tmp from 'tmp'

import { IntentClassifier } from '../../typings'

interface TrainSet {
  name: string
  utterances: Array<string>
}

export default class FastTextClassifier implements IntentClassifier {
  model: sdk.MLToolkit.FastText.Model

  constructor(private toolkit: typeof sdk.MLToolkit, private readonly logger: sdk.Logger) {
    this.model = new this.toolkit.FastText.Model()
  }

  private sanitizeText(text: string): string {
    return text.toLowerCase().replace(/[^\w\s]|\r|\f/gi, '')
  }

  private _writeTrainingSet(intents: TrainSet[], trainingFilePath: string) {
    const fileStream = createWriteStream(trainingFilePath, { flags: 'a' })

    for (const intent of intents) {
      intent.utterances.forEach(text => {
        const clean = this.sanitizeText(text)
        fileStream.write(`__label__${intent.name} ${clean}\n`)
      })
    }

    return Promise.fromCallback(cb => fileStream.end(cb))
  }

  private _hasSufficientData(intents: sdk.NLU.IntentDefinition[]) {
    const datasetSize = _.flatMap(intents, intent => intent.utterances).length
    return intents.length > 0 && datasetSize > 0
  }

  async train(intents: sdk.NLU.IntentDefinition[]): Promise<Buffer | undefined> {
    if (this._hasSufficientData(intents)) {
      const dataFn = tmp.tmpNameSync({ postfix: '.txt' })
      await this._writeTrainingSet(intents, dataFn)

      const modelFn = tmp.tmpNameSync({ postfix: '.bin' })

      // TODO Apply parameters from Grid-search here
      const ft = new this.toolkit.FastText.Model()
      await ft.trainToFile('supervised', modelFn, {
        input: dataFn,
        loss: 'hs',
        dim: 15,
        wordNgrams: 3,
        minCount: 1,
        minn: 3,
        maxn: 6,
        bucket: 25000,
        epoch: 50,
        lr: 0.8
      })

      this.model = ft

      return readFileSync(modelFn)
    } else {
      return undefined
    }
  }

  async load(model: Buffer) {
    const tmpFn = tmp.tmpNameSync({ postfix: '.bin' })
    writeFileSync(tmpFn, model)
    const ft = new this.toolkit.FastText.Model()
    await ft.loadFromFile(tmpFn)

    this.model = ft
  }

  public async predict(input: string): Promise<sdk.NLU.Intent[]> {
    if (!this.model) {
      throw new Error('No model loaded')
    }

    const sanitized = this.sanitizeText(input)
    try {
      const pred = await this.model.predict(sanitized, 5)
      if (!pred || !pred.length) {
        return []
      }
      return pred.map(x => ({ name: x.label.replace('__label__', ''), confidence: x.value }))
    } catch (e) {
      this.logger.attachError(e).error(`Error predicting intent for "${sanitized}"`)
    }
  }
}
