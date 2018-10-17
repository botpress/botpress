import { createWriteStream, writeFileSync } from 'fs'
import { EOL } from 'os'
import tmp from 'tmp'
import { join } from 'upath'

import FTWrapper from './fasttext.wrapper'

const FAST_TEXT_LABEL_KEY = '__label__'

interface Intent {
  name: string
  utterances: Array<String>
}

interface Prediction {
  name: string
  confidence: number
}

// TODO implement fastTrain
// TODO better error handling please
// TODO implement testModel ?

class FastTextClassifier {
  private modelPath = ''

  public currentModelId: string | undefined

  private parsePredictions(predictionStr: string) {
    const predictions = predictionStr.split(FAST_TEXT_LABEL_KEY)

    return predictions.filter(p => p != '').map(p => {
      p = p.replace(FAST_TEXT_LABEL_KEY, '')
      const psplit = p.split(' ')

      return {
        name: psplit[0],
        confidence: parseFloat(psplit[1])
      }
    })
  }

  private writeTrainingSet(intents: Array<Intent>, trainingFilePath) {
    const fileStream = createWriteStream(trainingFilePath, { flags: 'a' })

    for (const intent of intents) {
      intent.utterances.forEach(text => {
        fileStream.write(`${FAST_TEXT_LABEL_KEY}${intent.name} ${text}${EOL}`)
      })
    }

    return Promise.fromCallback(cb => fileStream.end(cb))
  }

  async train(intents: Array<Intent>) {
    const dataFn = tmp.tmpNameSync()
    await this.writeTrainingSet(intents, dataFn)

    const modelFn = tmp.tmpNameSync()
    FTWrapper.supervised(dataFn, modelFn)
    return (this.modelPath = `${modelFn}.bin`)
  }

  loadModel(model: Buffer, modelId?: string) {
    this.currentModelId =
      modelId ||
      Math.random()
        .toString()
        .substr(0)

    const tmpFn = tmp.tmpNameSync()
    writeFileSync(tmpFn, model)
    this.modelPath = tmpFn
  }

  predict(input: string, numClass = 1): Array<Prediction> {
    if (!this.modelPath) {
      throw new Error('model is not set')
    }

    const tmpF = tmp.fileSync()
    writeFileSync(tmpF.name, input)

    const preds = FTWrapper.predictProb(this.modelPath, tmpF.name, numClass)
    tmpF.removeCallback()

    return this.parsePredictions(preds)
  }
}

export default FastTextClassifier
