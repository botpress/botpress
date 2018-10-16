import { createWriteStream, writeFileSync } from 'fs'
import { EOL } from 'os'
import { join } from 'path'
import tmp from 'tmp'

import FTWrapper from './fasttext.wrapper'

const FAST_TEXT_LABEL_KEY = '__label__'

interface Intent {
  name: string
  utterances: Array<String>
}

// TODO implement fastTrain
// TODO better error handling please
// TODO implement testModel ?

class FastTextClassifier {
  private modelPath = ''

  private newModelPath(withExt: boolean) {
    const ext = withExt ? '.bin' : ''
    return join(__dirname, `../models/${Date.now()}${ext}`)
  }

  private parsePredictions(predictionStr: string) {
    const predictions = predictionStr.split(FAST_TEXT_LABEL_KEY)

    return predictions.filter(p => p != '').map(p => {
      p = p.replace(FAST_TEXT_LABEL_KEY, '')
      const psplit = p.split(' ')

      return {
        label: psplit[0],
        confidence: parseFloat(psplit[1])
      }
    })
  }

  private writeTrainingSet(intents: Array<Intent>, trainingFilePath) {
    const fileStream = createWriteStream(trainingFilePath, { flags: 'a' })

    let chunk = ''
    let counter = 0
    for (const intent of intents) {
      intent.utterances.forEach(text => {
        chunk += `${FAST_TEXT_LABEL_KEY}${intent.name} ${text}${EOL}`
        if (++counter % 100 === 0) {
          fileStream.write(chunk)
          chunk = ''
        }
      })
    }
    fileStream.end()
  }

  train(intents: Array<Intent>) {
    const trainFileName = tmp.tmpNameSync()
    const modelFileName = this.newModelPath(false)

    this.writeTrainingSet(intents, trainFileName)

    FTWrapper.supervised(trainFileName, modelFileName)
    this.modelPath = `${modelFileName}.bin`
  }

  loadModel(model: Buffer) {
    const modelPath = this.newModelPath(true)

    writeFileSync(modelPath, model)

    this.modelPath = modelPath
  }

  predict(input: string, numClass = 1) {
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
