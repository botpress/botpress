import * as sdk from 'botpress/sdk'
import { createWriteStream, fstat, readFileSync, writeFileSync } from 'fs'
import tmp from 'tmp'

import FastTextWrapper from '../../tools/fastText'
import { IntentClassifier, Model } from '../../typings'

interface TrainSet {
  name: string
  utterances: Array<string>
}

export default class FastTextClassifier implements IntentClassifier {
  constructor(private readonly logger: sdk.Logger) { }

  private fastTextWrapper!: FastTextWrapper

  public currentModelId: string | undefined

  private sanitizeText(text: string): string {
    return text.toLowerCase().replace(/[^\w\s]/gi, '')
  }

  private _writeTrainingSet(intents: TrainSet[], trainingFilePath: string) {
    const fileStream = createWriteStream(trainingFilePath, { flags: 'a' })

    for (const intent of intents) {
      intent.utterances.forEach(text => {
        const clean = this.sanitizeText(text)
        fileStream.write(`${FastTextWrapper.LABEL_PREFIX}${intent.name} ${clean}\n`)
      })
    }

    return Promise.fromCallback(cb => fileStream.end(cb))
  }

  async train(intents: Array<TrainSet>, modelId: string): Promise<Buffer> {
    const dataFn = tmp.tmpNameSync()
    await this._writeTrainingSet(intents, dataFn)

    const modelFn = tmp.tmpNameSync()
    const modelPath = `${modelFn}.bin`

    // TODO: Add parameters Grid Search logic here
    this.fastTextWrapper = new FastTextWrapper(modelPath)

    this.fastTextWrapper.train(dataFn, { method: 'supervised' })
    this.currentModelId = modelId

    return readFileSync(modelPath)
  }

  loadModel(model: Buffer, modelId?: string) {
    this.currentModelId = modelId
    const tmpFn = tmp.tmpNameSync()
    writeFileSync(tmpFn, model)
    this.fastTextWrapper = new FastTextWrapper(tmpFn)
  }

  public async predict(input: string): Promise<sdk.NLU.Intent[]> {
    if (!this.fastTextWrapper) {
      throw new Error('model is not set')
    }

    return this.fastTextWrapper.predict(this.sanitizeText(input), 5) as Promise<sdk.NLU.Intent[]>
  }
}
