import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import { flatMap } from 'lodash'
import _ from 'lodash'
import ms from 'ms'

import { Config } from '../config'

import { DucklingEntityExtractor } from './pipelines/entities/duckling_extractor'
import { extractListEntities, extractPatternEntities } from './pipelines/entities/pattern_extractor'
import FastTextClassifier from './pipelines/intents/ft_classifier'
import { createIntentMatcher, findMostConfidentIntentMeanStd } from './pipelines/intents/utils'
import { FastTextLanguageId } from './pipelines/language/ft_lid'
import CRFExtractor from './pipelines/slots/crf_extractor'
import { generateTrainingSequence } from './pipelines/slots/pre-processor'
import Storage from './storage'
import { EntityExtractor, LanguageIdentifier, Model, MODEL_TYPES, SlotExtractor } from './typings'

export default class ScopedEngine {
  public readonly storage: Storage
  public confidenceTreshold: number = 0.7

  private _preloaded: boolean = false
  private _currentModelHash: string

  private readonly intentClassifier: FastTextClassifier
  private readonly langDetector: LanguageIdentifier
  private readonly systemEntityExtractor: EntityExtractor
  private readonly slotExtractor: SlotExtractor

  private retryPolicy = {
    interval: 100,
    max_interval: 500,
    timeout: 5000,
    max_tries: 3
  }

  private _isSyncing: boolean
  private _isSyncingTwice: boolean
  private _autoTrainInterval: number = 0
  private _autoTrainTimer: NodeJS.Timer

  constructor(
    private logger: sdk.Logger,
    private botId: string,
    private readonly config: Config,
    readonly toolkit: typeof sdk.MLToolkit
  ) {
    this.storage = new Storage(config, this.botId)
    this.intentClassifier = new FastTextClassifier(toolkit, this.logger)
    this.langDetector = new FastTextLanguageId(toolkit, this.logger)
    this.systemEntityExtractor = new DucklingEntityExtractor(this.logger)
    this.slotExtractor = new CRFExtractor(toolkit)
    this._autoTrainInterval = ms(config.autoTrainInterval || 0)
  }

  async init(): Promise<void> {
    this.confidenceTreshold = this.config.confidenceTreshold

    if (isNaN(this.confidenceTreshold) || this.confidenceTreshold < 0 || this.confidenceTreshold > 1) {
      this.confidenceTreshold = 0.7
    }

    if (!isNaN(this._autoTrainInterval) && this._autoTrainInterval >= 5000) {
      if (this._autoTrainTimer) {
        clearInterval(this._autoTrainTimer)
      }
      this._autoTrainTimer = setInterval(async () => {
        if (this._preloaded && (await this.checkSyncNeeded())) {
          // Sync only if the model has been already loaded
          this.sync()
        }
      }, this._autoTrainInterval)
    }
  }

  async sync(): Promise<void> {
    if (this._isSyncing) {
      this._isSyncingTwice = true
      return
    }

    try {
      this._isSyncing = true
      const intents = await this.storage.getIntents()
      const modelHash = this._getModelHash(intents)

      if (await this.storage.modelExists(modelHash)) {
        try {
          await this._loadModels(intents, modelHash)
        } catch (e) {
          this.logger.attachError(e).warn('Cannot load models from storage')
          await this._trainModels(intents, modelHash)
        }
      } else {
        this.logger.debug('Models need to be retrained')
        await this._trainModels(intents, modelHash)
      }

      this._currentModelHash = modelHash
      this._preloaded = true
    } finally {
      this._isSyncing = false
      if (this._isSyncingTwice) {
        this._isSyncingTwice = false
        this.sync() // This floating promise is voluntary
      }
    }
  }

  async extract(incomingEvent: sdk.IO.Event): Promise<sdk.IO.EventUnderstanding> {
    if (!this._preloaded) {
      await this.sync()
    }

    return retry(() => this._extract(incomingEvent), this.retryPolicy)
  }

  async checkSyncNeeded(): Promise<boolean> {
    const intents = await this.storage.getIntents()
    const modelHash = this._getModelHash(intents)

    return intents.length && this._currentModelHash !== modelHash && !this._isSyncing
  }

  private async _loadModels(intents: sdk.NLU.IntentDefinition[], modelHash: string) {
    this.logger.debug(`Restoring models '${modelHash}' from storage`)

    const models = await this.storage.getModelsFromHash(modelHash)

    const intentModels = _.chain(models)
      .filter(model => model.meta.type === MODEL_TYPES.INTENT)
      .orderBy(model => model.meta.created_on, 'desc')
      .uniqBy(model => model.meta.hash + ' ' + model.meta.type + ' ' + model.meta.context)
      .map(x => ({ name: x.meta.context, model: x.model }))
      .value()

    const skipgramModel = models.find(model => model.meta.type === MODEL_TYPES.SLOT_LANG)
    const crfModel = models.find(model => model.meta.type === MODEL_TYPES.SLOT_CRF)

    if (!intentModels || !intentModels.length || !skipgramModel || !crfModel) {
      throw new Error(`No such model. Hash = "${modelHash}"`)
    }

    await this.intentClassifier.load(intentModels)

    const trainingSet = flatMap(intents, intent => {
      return intent.utterances.map(utterance => generateTrainingSequence(utterance, intent.slots, intent.name))
    })

    await this.slotExtractor.load(trainingSet, skipgramModel.model, crfModel.model)

    this.logger.debug(`Done restoring models '${modelHash}' from storage`)
  }

  private _makeModel(context: string, hash: string, model: Buffer, type: string): Model {
    return {
      meta: {
        context,
        created_on: Date.now(),
        hash,
        type
      },
      model
    }
  }

  private async _trainIntentClassifier(intentDefs: sdk.NLU.IntentDefinition[], modelHash: string): Promise<Model[]> {
    this.logger.debug('Training intent classifier')

    try {
      const intentBuff = await this.intentClassifier.train(intentDefs)
      this.logger.debug('Done training intent classifier')
      return intentBuff.map(x => this._makeModel(x.name, modelHash, x.model, MODEL_TYPES.INTENT))
    } catch (err) {
      this.logger.attachError(err).error('Error training intents')
      throw Error('Unable to train model')
    }
  }

  private async _trainSlotTagger(intentDefs: sdk.NLU.IntentDefinition[], modelHash: string): Promise<Model[]> {
    this.logger.debug('Training slot tagger')

    try {
      const trainingSet = flatMap(intentDefs, intent => {
        return intent.utterances.map(utterance => generateTrainingSequence(utterance, intent.slots, intent.name))
      })
      const { language, crf } = await this.slotExtractor.train(trainingSet)
      this.logger.debug('Done training slot tagger')

      if (language && crf) {
        return [
          this._makeModel('global', modelHash, language, MODEL_TYPES.SLOT_LANG),
          this._makeModel('global', modelHash, crf, MODEL_TYPES.SLOT_CRF)
        ]
      } else return []
    } catch (err) {
      this.logger.attachError(err).error('Error training slot tagger')
      throw Error('Unable to train model')
    }
  }

  private async _trainModels(intentDefs: sdk.NLU.IntentDefinition[], modelHash: string) {
    try {
      const intentModels = await this._trainIntentClassifier(intentDefs, modelHash)
      const slotTaggerModels = await this._trainSlotTagger(intentDefs, modelHash)

      await this.storage.persistModels([...slotTaggerModels, ...intentModels])
    } catch (err) {
      this.logger.attachError(err)
    }
  }

  private _getModelHash(intents: sdk.NLU.IntentDefinition[]) {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(intents))
      .digest('hex')
  }

  private async _extractEntities(text: string, lang: string): Promise<sdk.NLU.Entity[]> {
    const customEntityDefs = await this.storage.getCustomEntities()
    const patternEntities = extractPatternEntities(text, customEntityDefs.filter(ent => ent.type === 'pattern'))
    const listEntities = extractListEntities(text, customEntityDefs.filter(ent => ent.type === 'list'))
    const systemEntities = await this.systemEntityExtractor.extract(text, lang)

    return [...systemEntities, ...patternEntities, ...listEntities]
  }

  private async _extractIntents(text: string): Promise<{ intents: sdk.NLU.Intent[]; intent: sdk.NLU.Intent }> {
    const intents = await this.intentClassifier.predict(text)
    const intent = findMostConfidentIntentMeanStd(intents, this.confidenceTreshold)
    intent.matches = createIntentMatcher(intent.name)

    return {
      intents,
      intent
    }
  }

  private async _extractSlots(
    text: string,
    intent: sdk.NLU.Intent,
    entities: sdk.NLU.Entity[]
  ): Promise<sdk.NLU.SlotsCollection> {
    const intentDef = await this.storage.getIntent(intent.name)
    return await this.slotExtractor.extract(text, intentDef, entities)
  }

  private async _extract(incomingEvent: sdk.IO.Event): Promise<sdk.IO.EventUnderstanding> {
    let ret: any = { errored: true }
    const t1 = Date.now()
    try {
      const text = incomingEvent.preview
      ret.language = await this.langDetector.identify(text)
      ret = { ...ret, ...(await this._extractIntents(text)) }
      ret.entities = await this._extractEntities(text, ret.language)
      ret.slots = await this._extractSlots(text, ret.intent, ret.entities)
      ret.errored = false
    } catch (error) {
      this.logger.attachError(error).error(`Could not extract whole NLU data, ${error}`)
    } finally {
      ret.ms = Date.now() - t1
      return ret as sdk.IO.EventUnderstanding
    }
  }
}
