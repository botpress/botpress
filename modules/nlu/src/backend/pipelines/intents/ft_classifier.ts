import { Logger } from 'botpress/sdk'
import { createWriteStream, writeFileSync } from 'fs'
import { EOL } from 'os'
import tmp from 'tmp'

import FastTextWrapper from '../../tools/fastText'

interface TrainSet {
  name: string
  utterances: Array<string>
}

export default class FastTextClassifier implements IntentClassifier {
  constructor(private readonly logger: Logger) {}

  private modelPath = ''

  public currentModelId: string | undefined

  private sanitizeText(text: string): string {
    return text.toLowerCase().replace(/[^\w\s]/gi, '')
  }

  private _writeTrainingSet(intents: TrainSet[], trainingFilePath: string) {
    const fileStream = createWriteStream(trainingFilePath, { flags: 'a' })

    for (const intent of intents) {
      intent.utterances.forEach(text => {
        const clean = this.sanitizeText(text)
        fileStream.write(`${FastTextWrapper.LABEL_PREFIX}${intent.name} ${clean}${EOL}`)
      })
    }

    return Promise.fromCallback(cb => fileStream.end(cb))
  }

  async train(intents: Array<TrainSet>, modelId: string) {
    const dataFn = tmp.tmpNameSync()
    await this._writeTrainingSet(intents, dataFn)

    const modelFn = tmp.tmpNameSync()
    FastTextWrapper.train(dataFn, modelFn, { method: 'supervised' })
    this.modelPath = `${modelFn}.bin`
    this.currentModelId = modelId

    return this.modelPath
  }

  loadModel(model: Buffer, modelId?: string) {
    this.currentModelId = modelId

    const tmpFn = tmp.tmpNameSync()
    writeFileSync(tmpFn, model)
    this.modelPath = tmpFn
  }

  public async predict(input: string): Promise<Predictions.Intent[]> {
    if (!this.modelPath) {
      throw new Error('model is not set')
    }

    return FastTextWrapper.predict(this.modelPath, this.sanitizeText(input), 5)
  }
}
