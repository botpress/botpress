import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import nanoid from 'nanoid'
import tmp from 'tmp'
import { VError } from 'verror'

import { FastTextOverrides } from '../../../config'

const debug = DEBUG('nlu')
  .sub('intents')
  .sub('vocab')

type Token = string
type Document = Token[]

export default class FastTextFeaturizer {
  private _modelsCache: { [key: string]: sdk.MLToolkit.FastText.Model } = {}

  public prebuiltWordVecPath: string | undefined

  constructor(private toolkit: typeof sdk.MLToolkit, private readonly ftOverrides: FastTextOverrides) {}

  private getFastTextParams(): Partial<sdk.MLToolkit.FastText.TrainArgs> {
    const extraArgs: Partial<sdk.MLToolkit.FastText.TrainArgs> = this.prebuiltWordVecPath
      ? { pretrainedVectors: this.prebuiltWordVecPath }
      : {}

    return {
      ...extraArgs,
      lr: _.get(this.ftOverrides, 'learningRate', 0.8),
      epoch: _.get(this.ftOverrides, 'epoch', 5),
      wordNgrams: _.get(this.ftOverrides, 'wordNgrams', 3),
      dim: 15
    }
  }

  public async loadModel(modelId: string, data: Buffer) {
    debug('restoring model: %s', modelId)

    if (this._modelsCache[modelId]) {
      debug('model already loaded: %s', modelId)
      return
    }

    const modelFn = tmp.tmpNameSync({ postfix: '.bin' })
    debug('copy  model to: %s', modelFn)
    fs.writeFileSync(modelFn, data)

    const ft = new this.toolkit.FastText.Model()
    await ft.loadFromFile(modelFn)
    debug('restored model: %s', modelId)

    this._modelsCache[modelId] = ft
  }

  public async getFeatures(modelId: string, doc: Document): Promise<number[]> {
    if (!this._modelsCache[modelId]) {
      throw new Error(`Vocab: Model '${modelId}' is not loaded in memory`)
    }

    return this._modelsCache[modelId].queryWordVectors(doc.join(''))
  }

  public async trainVocab(modelId: string, documents: Document[]): Promise<Buffer> {
    const prefix = `lm-${nanoid()}-`
    const dataFn = tmp.tmpNameSync({ prefix, postfix: '.txt' })
    const modelFn = tmp.tmpNameSync({ prefix, postfix: '.bin' })

    debug('writing train data to file: %s', dataFn)
    fs.writeFileSync(dataFn, documents.map(tokens => tokens.join(' ')).join('\n'))

    const ft = new this.toolkit.FastText.Model()
    const params = {
      ...this.getFastTextParams(),
      input: dataFn
    }

    debug('training model', { params, modelFn })
    await ft.trainToFile('skipgram', modelFn, params)
    debug('trained')
    ft.cleanup()

    return fs.readFileSync(modelFn)
  }
}

// DONE Train: intents[]
// DONE Build total vocab
// DONE Tokenize vocab by language -> tokens[]
// DONE Train skipgram on vocab (tokens[])
// DONE ------------ LOAD IN MEMORY --------------

// Train context-level classifier (all ctx --> all utterances mixed together) => n * svm
// Train intent-level classier, one per context => m * svm
// Persist model metadata -> intent-model-{HASH64}.json

// Eval: utterance + CTX[]
// Tokenize utterance -> tokens[]
// ------------ LOAD/RESTORE LANGUAGE ------------
// 1. Determine which ctx -> probabilities per context ({ context, probability }[])
// 2. For each probably ctx, calculate most likely intent -> ({ intent, probability }[])
// 3. Ranker (ctx * probability * intent * probability)
