import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import { memoize } from 'lodash'
import _ from 'lodash'
import ms from 'ms'

import { Config } from '../config'

import { PipelineManager } from './pipeline-manager'
import { DucklingEntityExtractor } from './pipelines/entities/duckling_extractor'
import PatternExtractor from './pipelines/entities/pattern_extractor'
import { getTextWithoutEntities } from './pipelines/entities/util'
import ExactMatcher from './pipelines/intents/exact_matcher'
import SVMClassifier from './pipelines/intents/svm_classifier'
import { FastTextLanguageId } from './pipelines/language/ft_lid'
import { sanitize } from './pipelines/language/sanitizer'
import CRFExtractor from './pipelines/slots/crf_extractor'
import { generateTrainingSequence } from './pipelines/slots/pre-processor'
import Storage from './storage'
import { allInRange } from './tools/math'
import { makeTokens } from './tools/token-utils'
import { LanguageProvider, NluMlRecommendations, TrainingSequence } from './typings'
import {
  Engine,
  EntityExtractor,
  LanguageIdentifier,
  Model,
  MODEL_TYPES,
  NLUStructure,
  Sequence,
  SlotExtractor
} from './typings'

const debug = DEBUG('nlu')
const debugExtract = debug.sub('extract')
const debugIntents = debugExtract.sub('intents')
const debugEntities = debugExtract.sub('entities')
const debugSlots = debugExtract.sub('slots')
const debugLang = debugExtract.sub('lang')
const MIN_NB_UTTERANCES = 3
const GOOD_NB_UTTERANCES = 10
const AMBIGUITY_RANGE = 0.1 // +- 10% away from perfect median leads to ambiguity

export default class ScopedEngine implements Engine {
  public readonly storage: Storage
  public confidenceTreshold: number = 0.7

  private _preloaded: boolean = false

  private _currentModelHash: string
  private _exactIntentMatchers: { [lang: string]: ExactMatcher } = {}
  private readonly intentClassifiers: { [lang: string]: SVMClassifier } = {}
  private readonly langIdentifier: LanguageIdentifier
  private readonly systemEntityExtractor: EntityExtractor
  private readonly slotExtractors: { [lang: string]: SlotExtractor } = {}
  private readonly entityExtractor: PatternExtractor
  private readonly pipelineManager: PipelineManager
  private scopedGenerateTrainingSequence: (
    input: string,
    lang: string,
    slotDefinitions: sdk.NLU.SlotDefinition[],
    intentName: string,
    contexts: string[]
  ) => Promise<TrainingSequence>

  // move this in a functionnal util file?
  private readonly flatMapIdendity = (a, b) => a.concat(b)

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
    private readonly defaultLanguage: string,
    private readonly languageProvider: LanguageProvider,
    private realtime: typeof sdk.realtime,
    private realtimePayload: typeof sdk.RealTimePayload
  ) {
    this.scopedGenerateTrainingSequence = generateTrainingSequence(languageProvider, this.logger)
    this.pipelineManager = new PipelineManager()
    this.storage = new Storage(config, this.botId, defaultLanguage, languages, this.logger)
    this.langIdentifier = new FastTextLanguageId(toolkit, this.logger)
    this.systemEntityExtractor = new DucklingEntityExtractor(this.logger)
    this.entityExtractor = new PatternExtractor(toolkit, languageProvider)
    this._autoTrainInterval = ms(config.autoTrainInterval || '0')
    for (const lang of this.languages) {
      this.intentClassifiers[lang] = new SVMClassifier(toolkit, lang, languageProvider, realtime, realtimePayload)
      this.slotExtractors[lang] = new CRFExtractor(toolkit, realtime, realtimePayload)
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
      this.trainOrLoad()
    }

    if (!isNaN(this._autoTrainInterval) && this._autoTrainInterval >= 5000) {
      if (this._autoTrainTimer) {
        clearInterval(this._autoTrainTimer)
      }
      this._autoTrainTimer = setInterval(async () => {
        if (this._preloaded && (await this.checkSyncNeeded())) {
          // Sync only if the model has been already loaded
          this.trainOrLoad()
        }
      }, this._autoTrainInterval)
    }
  }

  protected async getIntents(): Promise<sdk.NLU.IntentDefinition[]> {
    return this.storage.getIntents()
  }

  public getMLRecommendations(): NluMlRecommendations {
    return {
      minUtterancesForML: MIN_NB_UTTERANCES,
      goodUtterancesForML: GOOD_NB_UTTERANCES
    }
  }

  /**
   * @return The trained model hash
   */
  async trainOrLoad(forceRetrain: boolean = false, confusionVersion = undefined): Promise<string> {
    if (this._isSyncing) {
      this._isSyncingTwice = true
      return
    }

    try {
      this._isSyncing = true
      const intents = await this.getIntents()
      const modelHash = this.computeModelHash(intents)
      let loaded = false

      const modelsExists = (await Promise.all(
        this.languages.map(async lang => await this.storage.modelExists(modelHash, lang))
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
        await this.trainModels(intents, modelHash, confusionVersion)

        this.logger.debug('Reloading models')
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
        return this.trainOrLoad() // This floating promise is voluntary
      }
    }

    return this._currentModelHash
  }

  async extract(text: string, lastMessages: string[], includedContexts: string[]): Promise<sdk.IO.EventUnderstanding> {
    if (!this._preloaded) {
      await this.trainOrLoad()
      const trainingComplete = { type: 'nlu', name: 'done', working: false, message: 'Model is up-to-date' }
      this.realtime.sendPayload(this.realtimePayload.forAdmins('statusbar.event', trainingComplete))
    }

    const t0 = Date.now()
    let res: any = { errored: true }

    try {
      const runner = this.pipelineManager
        .withPipeline(this._pipeline)
        .initFromText(text, lastMessages, includedContexts)

      const nluResults = (await retry(runner.run, this.retryPolicy)) as NLUStructure

      res = _.pick(
        nluResults,
        'intent',
        'intents',
        'ambiguous',
        'language',
        'detectedLanguage',
        'entities',
        'slots',
        'errored',
        'includedContexts'
      )

      res.errored = false
    } catch (error) {
      this.logger.attachError(error).error(`Could not extract whole NLU data, ${error}`)
    } finally {
      res.ms = Date.now() - t0
      return res as sdk.IO.EventUnderstanding
    }
  }

  async checkSyncNeeded(): Promise<boolean> {
    const intents = await this.storage.getIntents()
    const modelHash = this.computeModelHash(intents)

    return intents.length && this._currentModelHash !== modelHash && !this._isSyncing
  }

  getTrainingLanguages = (intents: sdk.NLU.IntentDefinition[]) =>
    _.chain(intents)
      .flatMap(intent =>
        Object.keys(intent.utterances).filter(lang => (intent.utterances[lang] || []).length >= MIN_NB_UTTERANCES)
      )
      .uniq()
      .value()

  private getTrainingSets = async (intentDefs: sdk.NLU.IntentDefinition[], lang: string): Promise<TrainingSequence[]> =>
    _.flatten(await Promise.map(intentDefs, intentDef => this.generateTrainingSequenceFromIntent(lang, intentDef)))

  private generateTrainingSequenceFromIntent = async (
    lang: string,
    intent: sdk.NLU.IntentDefinition
  ): Promise<TrainingSequence[]> =>
    await Promise.map(intent.utterances[lang] || [], utterance =>
      this.scopedGenerateTrainingSequence(utterance, lang, intent.slots, intent.name, intent.contexts)
    )

  protected async loadModels(intents: sdk.NLU.IntentDefinition[], modelHash: string) {
    this.logger.debug(`Restoring models '${modelHash}' from storage`)
    const trainableLangs = _.intersection(this.getTrainingLanguages(intents), this.languages)

    for (const lang of this.languages) {
      const trainingSet = await this.getTrainingSets(intents, lang)
      this._exactIntentMatchers[lang] = new ExactMatcher(trainingSet)

      if (!trainableLangs.includes(lang)) {
        return
      }

      const models = await this.storage.getModelsFromHash(modelHash, lang)

      const intentModels = _.chain(models)
        .filter(model => MODEL_TYPES.INTENT.includes(model.meta.type))
        .orderBy(model => model.meta.created_on, 'desc')
        .uniqBy(model => model.meta.hash + ' ' + model.meta.type + ' ' + model.meta.context)
        .value()

      const skipgramModel = models.find(model => model.meta.type === MODEL_TYPES.SLOT_LANG)
      const crfModel = models.find(model => model.meta.type === MODEL_TYPES.SLOT_CRF)

      if (!models.length) {
        return
      }

      if (_.isEmpty(skipgramModel)) {
        throw new Error(`Could not find skipgram model for slot tagging. Hash = "${modelHash}"`)
      }

      if (_.isEmpty(crfModel)) {
        throw new Error(`Could not find CRF model for slot tagging. Hash = "${modelHash}"`)
      }

      if (_.isEmpty(intentModels)) {
        throw new Error(`Could not find intent models. Hash = "${modelHash}"`)
      }

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
      const trainingSet = await this.getTrainingSets(intentDefs, lang)
      const { language, crf } = await this.slotExtractors[lang].train(trainingSet)

      this.logger.debug('Done training slot tagger')

      return language && crf
        ? [
            this._makeModel('global', modelHash, language, MODEL_TYPES.SLOT_LANG),
            this._makeModel('global', modelHash, crf, MODEL_TYPES.SLOT_CRF)
          ]
        : []
    } catch (err) {
      this.logger.attachError(err).error('Error training slot tagger')
      throw Error('Unable to train model')
    }
  }

  protected async trainModels(intentDefs: sdk.NLU.IntentDefinition[], modelHash: string, confusionVersion = undefined) {
    // TODO use the same data structure to train intent and slot models
    // TODO generate single training set here and filter

    for (const lang of this.languages) {
      try {
        const trainableIntents = intentDefs.filter(i => (i.utterances[lang] || []).length >= MIN_NB_UTTERANCES)

        if (trainableIntents.length) {
          const ctx_intent_models = await this.intentClassifiers[lang].train(trainableIntents, modelHash)
          const slotTaggerModels = await this._trainSlotTagger(trainableIntents, modelHash, lang)
          await this.storage.persistModels([...slotTaggerModels, ...ctx_intent_models], lang)
        }
      } catch (err) {
        this.logger.attachError(err).error('Error training NLU model')
      }
    }
  }

  public get modelHash() {
    return this._currentModelHash
  }

  public computeModelHash(intents: sdk.NLU.IntentDefinition[]) {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(intents))
      .digest('hex')
  }

  private _extractEntities = async (ds: NLUStructure): Promise<NLUStructure> => {
    const customEntityDefs = await this.storage.getCustomEntities()

    const patternEntities = await this.entityExtractor.extractPatterns(
      ds.rawText,
      customEntityDefs.filter(ent => ent.type === 'pattern')
    )

    const listEntities = await this.entityExtractor.extractLists(
      ds,
      customEntityDefs.filter(ent => ent.type === 'list')
    )

    const systemEntities = await this.systemEntityExtractor.extract(ds.rawText, ds.language)

    debugEntities.forBot(this.botId, ds.rawText, { systemEntities, patternEntities, listEntities })

    ds.entities = [...systemEntities, ...patternEntities, ...listEntities]
    return ds
  }

  // returns a promise to comply with PipelineStep
  private _setAmbiguity = (ds: NLUStructure): Promise<NLUStructure> => {
    const perfectConfusion = 1 / ds.intents.length
    const lower = perfectConfusion - AMBIGUITY_RANGE
    const upper = perfectConfusion + AMBIGUITY_RANGE

    ds.ambiguous = ds.intents.length > 1 && allInRange(ds.intents.map(i => i.confidence), lower, upper)

    return Promise.resolve(ds)
  }

  private _extractIntents = async (ds: NLUStructure): Promise<NLUStructure> => {
    const exactMatcher = this._exactIntentMatchers[ds.language]
    const exactIntent = exactMatcher && exactMatcher.exactMatch(ds)
    if (exactIntent) {
      ds.intent = exactIntent
      ds.intents = [exactIntent]
      return ds
    }

    const allIntents = (await this.getIntents()) || []
    const shouldPredict = allIntents.length && this.intentClassifiers[ds.language].isLoaded

    if (!shouldPredict) {
      return ds
    }

    const intents = await this.intentClassifiers[ds.language].predict(
      ds.tokens.map(t => t.cannonical),
      ds.includedContexts
    )

    // alter ctx with the given predictions in case where no ctx were provided
    ds.includedContexts = _.chain(intents)
      .map(p => p.context)
      .uniq()
      .value()

    ds.intents = intents
    ds.intent = intents[0]

    debugIntents.forBot(this.botId, ds.sanitizedText, { intents })

    return ds
  }

  private _setTextWithoutEntities = async (ds: NLUStructure): Promise<NLUStructure> => {
    ds.sanitizedText = getTextWithoutEntities(ds.entities, ds.rawText)
    ds.sanitizedLowerText = ds.sanitizedText.toLowerCase()
    return ds
  }

  private _tokenize = async (ds: NLUStructure): Promise<NLUStructure> => {
    const [rawTokens] = await this.languageProvider.tokenize([ds.sanitizedLowerText], ds.language)
    ds.tokens = makeTokens(rawTokens, ds.sanitizedText)
    return ds
  }

  private _extractSlots = async (ds: NLUStructure): Promise<NLUStructure> => {
    if (!ds.intent.name || ds.intent.name === 'none') {
      return ds
    }

    const intentDef = await this.storage.getIntent(ds.intent.name)

    if (!(intentDef.slots && intentDef.slots.length)) {
      return ds
    }

    ds.slots = await this.slotExtractors[ds.language].extract(ds, intentDef)

    debugSlots.forBot(this.botId, 'slots', { rawText: ds.rawText, slots: ds.slots })
    return ds
  }

  private _detectLang = async (ds: NLUStructure): Promise<NLUStructure> => {
    const lastMessages = _(ds.lastMessages)
      .reverse()
      .take(3)
      .concat(ds.rawText)
      .join(' ')

    const results = await this.langIdentifier.identify(lastMessages)

    const elected = _(results)
      .filter(score => this.languages.includes(score.label))
      .orderBy(lang => lang.value, 'desc')
      .first()

    if (_.isEmpty(elected)) {
      debugLang.forBot(this.botId, `Detected language is not supported, fallback to ${this.defaultLanguage}`)
    }

    ds.detectedLanguage = _.get(elected, 'label', 'n/a')
    ds.language = _.isEmpty(elected) || elected.value < 0.5 ? this.defaultLanguage : ds.detectedLanguage

    return ds
  }

  private _processText = (ds: NLUStructure): Promise<NLUStructure> => {
    const sanitized = sanitize(ds.rawText)
    ds.sanitizedText = sanitized
    ds.sanitizedLowerText = sanitized.toLowerCase()
    return Promise.resolve(ds)
  }

  private readonly _pipeline = [
    this._processText,
    this._detectLang,
    this._tokenize,
    this._extractEntities,
    this._setTextWithoutEntities,
    this._extractIntents,
    this._setAmbiguity,
    this._extractSlots
  ]
}
