import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import { memoize } from 'lodash'
import _ from 'lodash'
import ms from 'ms'

import { Config } from '../config'

import { MIN_NB_UTTERANCES } from './pipelines/constants'
import { DucklingEntityExtractor } from './pipelines/entities/duckling_extractor'
import PatternExtractor from './pipelines/entities/pattern_extractor'
import ExactMatcher from './pipelines/intents/exact_matcher'
import SVMClassifier from './pipelines/intents/svm_classifier'
import { createIntentMatcher, findMostConfidentIntentMeanStd } from './pipelines/intents/utils'
import { FastTextLanguageId } from './pipelines/language/ft_lid'
import { sanitize } from './pipelines/language/sanitizer'
import { tokenize } from './pipelines/language/tokenizers'
import CRFExtractor from './pipelines/slots/crf_extractor'
import { generateTrainingSequence } from './pipelines/slots/pre-processor'
import Storage from './storage'
import { Engine, EntityExtractor, LanguageIdentifier, Model, MODEL_TYPES, SlotExtractor } from './typings'

const debug = DEBUG('nlu')
const debugExtract = debug.sub('extract')
const debugIntents = debugExtract.sub('intents')
const debugEntities = debugExtract.sub('entities')
const debugSlots = debugExtract.sub('slots')

export default class ScopedEngine implements Engine {
  public readonly storage: Storage
  public confidenceTreshold: number = 0.7

  private _preloaded: boolean = false

  private _currentModelHash: string
  private _exactIntentMatchers: { [lang: string]: ExactMatcher } = {}

  private readonly intentClassifiers: { [lang: string]: SVMClassifier } = {}
  private readonly langDetector: LanguageIdentifier
  private readonly systemEntityExtractor: EntityExtractor
  private readonly slotExtractors: { [lang: string]: SlotExtractor } = {}
  private readonly entityExtractor: PatternExtractor

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
    protected logger: sdk.Logger,
    protected botId: string,
    protected readonly config: Config,
    readonly toolkit: typeof sdk.MLToolkit,
    protected readonly languages: string[],
    private readonly defaultLanguage: string
  ) {
    this.storage = new Storage(config, this.botId)
    this.langDetector = new FastTextLanguageId(toolkit, this.logger)
    this.systemEntityExtractor = new DucklingEntityExtractor(this.logger)
    this.entityExtractor = new PatternExtractor(toolkit)
    this._autoTrainInterval = ms(config.autoTrainInterval || '0')
    for (const lang of this.languages) {
      this.intentClassifiers[lang] = new SVMClassifier(toolkit, lang)
      this.slotExtractors[lang] = new CRFExtractor(toolkit)
    }
  }

  static loadingWarn = memoize((logger: sdk.Logger, model: string) => {
    logger.info(`Waiting for language model "${model}" to load, this may take some time ...`)
  })

  async init(): Promise<void> {
    this.confidenceTreshold = this.config.confidenceTreshold

    if (isNaN(this.confidenceTreshold) || this.confidenceTreshold < 0 || this.confidenceTreshold > 1) {
      this.confidenceTreshold = 0.7
    }

    if (this.config.preloadModels) {
      this.sync()
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

  protected async getIntents(): Promise<sdk.NLU.IntentDefinition[]> {
    return this.storage.getIntents()
  }

  /**
   * @return The trained model hash
   */
  async sync(forceRetrain: boolean = false): Promise<string> {
    if (this._isSyncing) {
      this._isSyncingTwice = true
      return
    }

    try {
      this._isSyncing = true
      const intents = await this.getIntents()
      const modelHash = this._getModelHash(intents)
      let loaded = false

      const modelsExists = (await Promise.all(
        this.languages.map(lang => this.storage.modelExists(modelHash, lang))
      )).every(_.identity)

      if (!forceRetrain && modelsExists) {
        try {
          await this.loadModels(intents, modelHash)
          loaded = true
        } catch (e) {
          this.logger.attachError(e).warn('Could not load models from storage')
        }
      }

      if (!loaded) {
        this.logger.debug('Retraining model')
        await this.trainModels(intents, modelHash)
        await this.loadModels(intents, modelHash)
      }

      this._currentModelHash = modelHash
      this._preloaded = true
    } catch (e) {
      this.logger.attachError(e).error('Could not sync model')
    } finally {
      this._isSyncing = false
      if (this._isSyncingTwice) {
        this._isSyncingTwice = false
        return this.sync() // This floating promise is voluntary
      }
    }

    return this._currentModelHash
  }

  async extract(text: string, includedContexts: string[]): Promise<sdk.IO.EventUnderstanding> {
    if (!this._preloaded) {
      await this.sync()
    }

    return retry(() => this._extract(text, includedContexts), this.retryPolicy)
  }

  async checkSyncNeeded(): Promise<boolean> {
    const intents = await this.storage.getIntents()
    const modelHash = this._getModelHash(intents)

    return intents.length && this._currentModelHash !== modelHash && !this._isSyncing
  }

  protected async loadModels(intents: sdk.NLU.IntentDefinition[], modelHash: string) {
    this.logger.debug(`Restoring models '${modelHash}' from storage`)

    for (const lang of this.languages) {
      const models = await this.storage.getModelsFromHash(modelHash, lang)

      const intentModels = _.chain(models)
        .filter(model => MODEL_TYPES.INTENT.includes(model.meta.type))
        .orderBy(model => model.meta.created_on, 'desc')
        .uniqBy(model => model.meta.hash + ' ' + model.meta.type + ' ' + model.meta.context)
        .value()

      const skipgramModel = models.find(model => model.meta.type === MODEL_TYPES.SLOT_LANG)
      const crfModel = models.find(model => model.meta.type === MODEL_TYPES.SLOT_CRF)

      if (!skipgramModel) {
        throw new Error(`Could not find skipgram model for slot tagging. Hash = "${modelHash}"`)
      }

      if (!skipgramModel) {
        throw new Error(`Could not find CRF model for slot tagging. Hash = "${modelHash}"`)
      }

      if (!intentModels || !intentModels.length) {
        throw new Error(`Could not find intent models. Hash = "${modelHash}"`)
      }

      const trainingSet = intents
        .map(intent => {
          return (intent.utterances[lang] || []).map(utterance =>
            generateTrainingSequence(utterance, lang, intent.slots, intent.name)
          )
        })
        .reduce((a, b) => a.concat(b), [])

      this._exactIntentMatchers[lang] = new ExactMatcher(trainingSet)

      await this.intentClassifiers[lang].load(intentModels)
      await this.slotExtractors[lang].load(trainingSet, skipgramModel.model, crfModel.model)
    }

    this.logger.debug(`Done restoring models '${modelHash}' from storage`)
  }

  private _makeModel(context: string, hash: string, model: Buffer, type: string): Model {
    return {
      meta: {
        context,
        created_on: Date.now(),
        hash,
        type,
        scope: 'bot'
      },
      model
    }
  }

  private async _trainSlotTagger(
    intentDefs: sdk.NLU.IntentDefinition[],
    modelHash: string,
    lang: string
  ): Promise<Model[]> {
    this.logger.debug('Training slot tagger')

    try {
      const trainingSet = intentDefs
        .map(intent => {
          return (intent.utterances[lang] || []).map(utterance =>
            generateTrainingSequence(utterance, lang, intent.slots, intent.name)
          )
        })
        .reduce((a, b) => a.concat(b), [])

      const { language, crf } = await this.slotExtractors[lang].train(trainingSet)

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

  protected async trainModels(intentDefs: sdk.NLU.IntentDefinition[], modelHash: string) {
    // TODO use the same data structure to train intent and slot models
    // TODO generate single training set here and filter
    for (const lang of this.languages) {
      try {
        const trainableIntents = intentDefs.filter(i => (i.utterances[lang] || []).length >= MIN_NB_UTTERANCES)

        const ctx_intent_models = await this.intentClassifiers[lang].train(trainableIntents, modelHash)
        const slotTaggerModels = await this._trainSlotTagger(trainableIntents, modelHash, lang)

        await this.storage.persistModels([...slotTaggerModels, ...ctx_intent_models], lang)
      } catch (err) {
        this.logger.attachError(err).error('Error training NLU model')
      }
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

    const patternEntities = await this.entityExtractor.extractPatterns(
      text,
      customEntityDefs.filter(ent => ent.type === 'pattern')
    )

    const listEntities = await this.entityExtractor.extractLists(
      text,
      lang,
      customEntityDefs.filter(ent => ent.type === 'list')
    )

    const systemEntities = await this.systemEntityExtractor.extract(text, lang)
    debugEntities(text, { systemEntities, patternEntities, listEntities })
    return [...systemEntities, ...patternEntities, ...listEntities]
  }

  private async _extractIntents(
    originalText: string,
    noEntitiesText: string,
    lang: string,
    includedContexts: string[]
  ): Promise<{ intents: sdk.NLU.Intent[]; intent: sdk.NLU.Intent; includedContexts: string[] }> {
    const lowerText = sanitize(noEntitiesText.toLowerCase())
    const tokens = await tokenize(lowerText, lang)

    const exactIntent = this._exactIntentMatchers[lang].exactMatch(
      sanitize(originalText.toLowerCase()),
      includedContexts
    )

    if (exactIntent) {
      return {
        includedContexts,
        intent: exactIntent,
        intents: [exactIntent]
      }
    }

    const intents = await this.intentClassifiers[lang].predict(tokens, includedContexts)

    // TODO: This is no longer relevant because of multi-context
    // We need to actually check if there's a clear winner
    // We also need to adjust the scores depending on the interaction model
    // We need to return a disambiguation flag here too if we're uncertain
    const intent = findMostConfidentIntentMeanStd(intents, this.confidenceTreshold)
    intent.matches = createIntentMatcher(intent.name)

    // alter ctx with the given predictions in case where no ctx were provided
    includedContexts = _.chain(intents)
      .map(p => p.context)
      .uniq()
      .value()

    debugIntents(noEntitiesText, { intents })

    return {
      includedContexts,
      intents,
      intent
    }
  }

  private async _extractSlots(
    text: string,
    lang: string,
    intent: sdk.NLU.Intent,
    entities: sdk.NLU.Entity[]
  ): Promise<sdk.NLU.SlotCollection> {
    const intentDef = await this.storage.getIntent(intent.name)
    return await this.slotExtractors[lang].extract(text, lang, intentDef, entities)
  }

  private async _extract(text: string, includedContexts: string[]): Promise<sdk.IO.EventUnderstanding> {
    let res: any = { errored: true }
    const t1 = Date.now()
    try {
      res.language = await this._detectLang(text)
      const entities = await this._extractEntities(text, res.language)

      const entitiesToReplace = _.chain(entities)
        .filter(x => x.type === 'pattern' || x.type === 'list')
        .orderBy(['entity.meta.start', 'entity.meta.confidence'], ['asc', 'desc'])
        .value()

      let noEntitiesText = ''
      let cursor = 0

      for (const entity of entitiesToReplace) {
        if (entity.meta.start < cursor) {
          continue
        }

        noEntitiesText += text.substr(cursor, entity.meta.start - cursor) + entity.name
        cursor = entity.meta.end
      }

      noEntitiesText += text.substr(cursor, text.length - cursor)

      res = { ...res, ...(await this._extractIntents(text, noEntitiesText, res.language, includedContexts)) }
      res.entities = entities

      console.log('INTENT IS')
      console.log(res.intent.name)

      res.slots = res.intent.name === 'none' ? {} : await this._extractSlots(text, res.language, res.intent, entities)

      debugSlots('slots', { text, slots: res.slots })
      res.errored = false
    } catch (error) {
      this.logger.attachError(error).error(`Could not extract whole NLU data, ${error}`)
    } finally {
      res.ms = Date.now() - t1
      return res as sdk.IO.EventUnderstanding
    }
  }

  private async _detectLang(text: string): Promise<string> {
    let lang = await this.langDetector.identify(text)
    if (!lang || lang === 'n/a' || !this.languages.includes(lang)) {
      this.logger.debug(`Detected language (${lang}) is not supported, fallback to ${this.defaultLanguage}`)
      lang = this.defaultLanguage
    }

    return lang
  }
}
