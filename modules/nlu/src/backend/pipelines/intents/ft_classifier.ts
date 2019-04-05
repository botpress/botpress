import * as sdk from 'botpress/sdk'
import { createWriteStream, readFileSync, writeFileSync } from 'fs'
import _ from 'lodash'
import tmp from 'tmp'
import { VError } from 'verror'

import { FastTextOverrides } from '../../../config'
import { IntentClassifier, IntentModel } from '../../typings'

const debug = DEBUG('nlu').sub('intents')
const debugTrain = debug.sub('train')
const debugPredict = debug.sub('predict')

interface TrainSet {
  name: string
  utterances: Array<string>
}

export default class FastTextClassifier implements IntentClassifier {
  private _modelsByContext: { [key: string]: sdk.MLToolkit.FastText.Model } = {}

  public prebuiltWordVecPath: string | undefined

  constructor(
    private toolkit: typeof sdk.MLToolkit,
    private readonly logger: sdk.Logger,
    private readonly ftOverrides: FastTextOverrides
  ) {}

  private getFastTextParams(): Partial<sdk.MLToolkit.FastText.TrainArgs> {
    const extraArgs: Partial<sdk.MLToolkit.FastText.TrainArgs> = this.prebuiltWordVecPath
      ? { pretrainedVectors: this.prebuiltWordVecPath }
      : {}

    return {
      ...extraArgs,
      lr: _.get(this.ftOverrides, 'learningRate', 0.8),
      epoch: _.get(this.ftOverrides, 'epoch', 5),
      wordNgrams: _.get(this.ftOverrides, 'wordNgrams', 3)
    }
  }

  private sanitizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\t|\r|\f/gi, ' ')
      .replace(/\s\s+/gi, ' ')
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

  private teardownModels() {
    if (this._modelsByContext) {
      _.values(this._modelsByContext).forEach(x => x.cleanup())
    }
  }

  private _hasSufficientData(intents: sdk.NLU.IntentDefinition[]) {
    const datasetSize = _.flatMap(intents, intent => intent.utterances).length
    return intents.length > 0 && datasetSize > 0
  }

  private async _trainForOneModel(
    intents: sdk.NLU.IntentDefinition[],
    modelName: string
  ): Promise<{ ft: sdk.MLToolkit.FastText.Model; data: Buffer }> {
    const dataFn = tmp.tmpNameSync({ prefix: modelName + '-', postfix: '.txt' })
    await this._writeTrainingSet(intents, dataFn)

    const modelFn = tmp.tmpNameSync({ postfix: '.bin' })

    // TODO Apply parameters from Grid-search here
    const ft = new this.toolkit.FastText.Model()

    const params = {
      ...this.getFastTextParams(),
      input: dataFn
    }

    debugTrain('training fastText model', { modelName, fastTextParams: params })
    await ft.trainToFile('supervised', modelFn, params)
    debugTrain('done with fastText model')

    return { ft, data: readFileSync(modelFn) }
  }

  async train(intents: sdk.NLU.IntentDefinition[]): Promise<IntentModel[]> {
    const contextNames = _.uniq(_.flatMap(intents, x => x.contexts))

    const models: IntentModel[] = []
    const modelsByContext: { [key: string]: sdk.MLToolkit.FastText.Model } = {}

    debugTrain('contexts', contextNames)

    for (const context of contextNames) {
      // TODO Make the `none` intent undeletable, mandatory and pre-filled with random data
      const intentSet = intents.filter(x => x.contexts.includes(context) || x.name === 'none')

      if (this._hasSufficientData(intentSet)) {
        debugTrain('training context', context)
        try {
          const { ft, data } = await this._trainForOneModel(intentSet, context)
          modelsByContext[context] = ft
          models.push({ name: context, model: data })
        } catch (err) {
          throw new VError(err, `Error training set of intents for context "${context}"`)
        }
      } else {
        debugTrain('insufficent data, skip training context', context)
      }
    }

    this.teardownModels()
    this._modelsByContext = modelsByContext

    return models
  }

  async load(models: IntentModel[]) {
    const m: { [key: string]: sdk.MLToolkit.FastText.Model } = {}

    if (!models.length) {
      throw new Error(`You need to provide at least one model to load`)
    }

    if (_.uniqBy(models, 'name').length !== models.length) {
      const names = models.map(x => x.name).join(', ')
      throw new Error(`You can't train different models with the same names. Names = [${names}]`)
    }

    for (const model of models) {
      const tmpFn = tmp.tmpNameSync({ postfix: '.bin', prefix: model.name + '-' })
      writeFileSync(tmpFn, model.model)
      const ft = new this.toolkit.FastText.Model()
      await ft.loadFromFile(tmpFn)
      m[model.name] = ft
    }

    this.teardownModels()
    this._modelsByContext = m
  }

  private async _predictForOneModel(sanitizedInput: string, modelName: string): Promise<sdk.NLU.Intent[]> {
    if (!this._modelsByContext[modelName]) {
      throw new Error(`Can't predict for model named "${modelName}" (model not loaded)`)
    }

    try {
      const pred = await this._modelsByContext[modelName].predict(sanitizedInput, 5)
      if (!pred || !pred.length) {
        return []
      }
      return pred.map(x => ({ name: x.label.replace('__label__', ''), confidence: x.value, context: modelName }))
    } catch (e) {
      throw new VError(e, `Error predicting intent for model "${modelName}"`)
    }
  }

  public async predict(input: string, includedContexts: string[] = []): Promise<sdk.NLU.Intent[]> {
    if (!Object.keys(this._modelsByContext).length) {
      throw new Error('No model loaded. Make sure you `load` your models before you call `predict`.')
    }

    const sanitized = this.sanitizeText(input)

    // TODO change this context discriminatin by a weighted scoring instead
    // Add weights and affect the confidence results accordingly
    // ** no scoring algorithm has been choosen, impl is yet to be done
    const modelNames = Object.keys(this._modelsByContext).filter(
      ctx => !includedContexts.length || includedContexts.includes(ctx)
    )
    try {
      debugPredict('prediction request %o', { includedContexts, input, sanitized })
      const predictions = await Promise.map(modelNames, modelName => this._predictForOneModel(sanitized, modelName))
      debugPredict('predictions done %o', { includedContexts, input, sanitized, predictions })

      return _.chain(predictions)
        .flatten()
        .orderBy('confidence', 'desc')
        .uniqBy(x => x.name)
        .value()
    } catch (e) {
      throw new VError(e, `Error predicting intent for "${sanitized}"`)
    }
  }
}
