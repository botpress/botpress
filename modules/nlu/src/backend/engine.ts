import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import { memoize } from 'lodash'
import _ from 'lodash'
import ms from 'ms'

import { Config } from '../config'

import {
  DefaultHashAlgorithm,
  NoneHashAlgorithm,
  PipelineManager,
  PipelineStep2,
  runPipeline
} from './pipeline-manager'
import { DucklingEntityExtractor } from './pipelines/entities/duckling_extractor'
import PatternExtractor from './pipelines/entities/pattern_extractor'
import ExactMatcher from './pipelines/intents/exact_matcher'
import SVMClassifier from './pipelines/intents/svm_classifier'
import { getHighlightedIntentEntities } from './pipelines/intents/utils'
import { FastTextLanguageId } from './pipelines/language/ft_lid'
import { sanitize } from './pipelines/language/sanitizer'
import CRFExtractor from './pipelines/slots/crf_extractor'
import { assignMatchedEntitiesToTokens, generateTrainingSequence, keepNothing } from './pipelines/slots/pre-processor'
import Storage from './storage'
import { allInRange } from './tools/math'
import { makeTokens, mergeSpecialCharactersTokens } from './tools/token-utils'
import { LanguageProvider, NluMlRecommendations, TrainingSequence } from './typings'
import { Engine, LanguageIdentifier, Model, MODEL_TYPES, NLUStructure } from './typings'

const debug = DEBUG('nlu')
const debugTrain = debug.sub('training')
const debugExtract = debug.sub('extract')
const debugIntents = debugExtract.sub('intents')
const debugEntities = debugExtract.sub('entities')
const debugSlots = debugExtract.sub('slots')
const debugLang = debugExtract.sub('lang')
const MIN_NB_UTTERANCES = 3
const GOOD_NB_UTTERANCES = 10
const AMBIGUITY_RANGE = 0.1 // +- 10% away from perfect median leads to ambiguity
const NA_LANG = 'n/a'

// DEPRECATED
export default class ScopedEngine implements Engine {
  public readonly storage: Storage

  private _preloaded: boolean = false
  private _currentModelHash: string
  private _exactIntentMatchers: { [lang: string]: ExactMatcher } = {}
  private readonly intentClassifiers: { [lang: string]: SVMClassifier } = {}
  private readonly langIdentifier: LanguageIdentifier
  private readonly systemEntityExtractor: DucklingEntityExtractor
  private readonly slotExtractors: { [lang: string]: CRFExtractor } = {}
  private readonly entityExtractor: PatternExtractor
  private readonly pipelineManager: PipelineManager

  private scopedGenerateTrainingSequence: (
    input: string,
    lang: string,
    slotDefinitions: sdk.NLU.SlotDefinition[],
    intentName: string,
    contexts: string[]
  ) => Promise<TrainingSequence>
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
    this.pipelineManager = new PipelineManager(this.logger)
    this.storage = new Storage(this.botId, defaultLanguage, languages, this.logger)
    this.langIdentifier = new FastTextLanguageId(toolkit)
    this.systemEntityExtractor = new DucklingEntityExtractor(this.logger)
    this.entityExtractor = new PatternExtractor(toolkit, languageProvider)
    this._autoTrainInterval = ms(config.autoTrainInterval || '0')
    for (const lang of this.languages) {
      this.intentClassifiers[lang] = new SVMClassifier(toolkit, lang, languageProvider, realtime, realtimePayload)
      this.slotExtractors[lang] = new CRFExtractor(toolkit, realtime, realtimePayload, languageProvider, lang)
    }
  }

  static loadingWarn = memoize((logger: sdk.Logger, model: string) => {
    logger.info(`Waiting for language model "${model}" to load, this may take some time ...`)
  })

  async init(): Promise<void> {
    if (this.config.preloadModels) {
      await this.trainOrLoad()
    }

    if (!isNaN(this._autoTrainInterval) && this._autoTrainInterval >= 5000) {
      if (this._autoTrainTimer) {
        clearInterval(this._autoTrainTimer)
      }
      this._autoTrainTimer = setInterval(async () => {
        if (this._preloaded && (await this.checkSyncNeeded())) {
          // Sync only if the model has been already loaded
          await this.trainOrLoad()
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
      const startTraining = { type: 'nlu', name: 'train', working: true, message: 'Training model' }
      this.realtime.sendPayload(this.realtimePayload.forAdmins('statusbar.event', startTraining))

      this._isSyncing = true
      const intents = await this.getIntents()
      const entities = await this.storage.getCustomEntities()
      const modelHash = this.computeModelHash(intents, entities)
      let loaded = false

      const modelsExists = (await Promise.map(this.languages, lang => this.storage.modelExists(modelHash, lang))).every(
        _.identity
      )

      if (!forceRetrain && modelsExists) {
        try {
          await this.loadModels(intents, modelHash)
          loaded = true
        } catch (e) {
          this.logger.attachError(e).warn('Could not load models from storage')
        }
      }

      if (!loaded) {
        this.logger.forBot(this.botId).info(`Retraining model for bot ${this.botId}...`)
        await this.trainModels(intents, modelHash, confusionVersion)
        await this.loadModels(intents, modelHash)
        this.logger.forBot(this.botId).info(`Model training completed for bot ${this.botId}`)
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

    const trainingComplete = { type: 'nlu', name: 'done', working: false, message: 'Model is up-to-date' }
    this.realtime.sendPayload(this.realtimePayload.forAdmins('statusbar.event', trainingComplete))

    return this._currentModelHash
  }

  async extract(text: string, lastMessages: string[], includedContexts: string[]): Promise<sdk.IO.EventUnderstanding> {
    if (!this._preloaded) {
      await this.trainOrLoad()
      const trainingComplete = { type: 'nlu', name: 'done', working: false, message: 'Model is up-to-date' }
      this.realtime.sendPayload(this.realtimePayload.forAdmins('statusbar.event', trainingComplete))
    }

    const t0 = Date.now()
    let res: any = {}

    try {
      const runner = this.pipelineManager
        .withPipeline(this._predictPipeline)
        .initFromText(text, lastMessages, includedContexts)

      const nluResults = await runner.run()

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
    } catch (error) {
      this.logger.attachError(error).error(`Could not extract whole NLU data, ${error}`)
    } finally {
      res.ms = Date.now() - t0
      return res as sdk.IO.EventUnderstanding
    }
  }

  async checkSyncNeeded(): Promise<boolean> {
    const intents = await this.storage.getIntents()
    const entities = await this.storage.getCustomEntities()
    const modelHash = this.computeModelHash(intents, entities)

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
    debugTrain.forBot(this.botId, `Restoring models '${modelHash}' from storage`)
    const trainableLangs = _.intersection(this.getTrainingLanguages(intents), this.languages)

    for (const lang of this.languages) {
      const trainingSet = await this.getTrainingSets(intents, lang)
      this._exactIntentMatchers[lang] = new ExactMatcher(trainingSet)

      if (!trainableLangs.includes(lang)) {
        continue
      }

      const models = await this.storage.getModelsFromHash(modelHash, lang)

      const intentModels = _.chain(models)
        .filter(model => MODEL_TYPES.INTENT.includes(model.meta.type))
        .orderBy(model => model.meta.created_on, 'desc')
        .uniqBy(model => model.meta.hash + ' ' + model.meta.type + ' ' + model.meta.context)
        .value()

      const crfModel = models.find(model => model.meta.type === MODEL_TYPES.SLOT_CRF)

      if (!models.length) {
        return
      }

      if (_.isEmpty(intentModels)) {
        throw new Error(`Could not find intent models. Hash = "${modelHash}"`)
      }

      await this.intentClassifiers[lang].load(intentModels)

      if (_.isEmpty(crfModel)) {
        debugTrain.forBot(this.botId, `No slots (CRF) model found for hash ${modelHash}`)
      } else {
        await this.slotExtractors[lang].load(trainingSet, crfModel.model)
      }
    }

    debugTrain.forBot(this.botId, `Done restoring models '${modelHash}' from storage`)
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

  // TODO: memoize this
  private async _buildIntentVocabs(
    intentDefs: sdk.NLU.IntentDefinition[],
    language: string
  ): Promise<{ [token: string]: string[] }> {
    const entities = await this.storage.getCustomEntities()
    const vocab = {}

    for (const intent of intentDefs) {
      const intentEntities = getHighlightedIntentEntities(intent)
      const synonyms = _.chain(entities)
        .filter(ent => ent.type === 'list')
        .intersectionWith(intentEntities, (entity, name) => entity.name === name)
        .flatMap(ent => ent.occurrences)
        .flatMap(occ => [occ.name, ...occ.synonyms])
        .map(_.toLower)
        .value()

      const cleaned = intent.utterances[language].map(utt => sanitize(keepNothing(utt)).toLowerCase())
      _.flatten(await this._tokenizeUtterances(cleaned.concat(synonyms), language)).forEach(token => {
        const word = token.canonical
        if (vocab[word] && vocab[word].indexOf(intent.name) === -1) {
          vocab[word].push(intent.name)
        } else {
          vocab[word] = [intent.name]
        }
      })
    }

    return vocab
  }

  private async _trainSlotTagger(
    intentDefs: sdk.NLU.IntentDefinition[],
    modelHash: string,
    lang: string
  ): Promise<Model[]> {
    debugTrain.forBot(this.botId, 'Training slot tagger')

    try {
      let trainingSet = await this.getTrainingSets(intentDefs, lang)
      // we might want to use tfidf instead and get rid of this thing
      const intentsVocab = await this._buildIntentVocabs(intentDefs, lang)
      const allowedEntitiesPerIntents = intentDefs
        .map(intent => ({
          [intent.name]: getHighlightedIntentEntities(intent)
        }))
        .reduce((acc, next) => ({ ...acc, ...next }), {})

      // TODO: Refactor this to use trainPipeline from A to Z instead of generating training sequences
      trainingSet = await Promise.mapSeries(trainingSet, async sequence => {
        const pipeline = this._buildTrainPipeline(lang)
        const output = await runPipeline(
          pipeline,
          { text: sequence.canonical, lastMessages: [], includedContexts: sequence.contexts },
          { caching: false }
        )

        if (sequence.tokens.length === output.result.tokens.length) {
          // TODO: make this step part of the trainPipeline
          const tokens = output.result.tokens
          const toks = assignMatchedEntitiesToTokens(tokens, output.result.entities)
          sequence.tokens = sequence.tokens.map((token, idx) => ({
            ...token,
            matchedEntities: toks[idx].matchedEntities
          }))
        } else {
          debug('[slots] could not provide entities to tokens because token sizes did not match', {
            pipelineLength: output.result.tokens.length,
            sequenceLength: sequence.tokens.length
          })
        }
        return sequence
      })

      const { crf } = await this.slotExtractors[lang].train(
        trainingSet,
        intentsVocab,
        allowedEntitiesPerIntents,
        this.intentClassifiers[lang].l1Tfidf, // TODO: compute tfidf in pipeline instead, made it a public property for now
        this.intentClassifiers[lang].token2vec // TODO: compute token2vec in pipeline instead, made it a public property for now
      )

      debugTrain.forBot(this.botId, 'Done training slot tagger')

      return crf ? [this._makeModel('global', modelHash, crf, MODEL_TYPES.SLOT_CRF)] : []
    } catch (err) {
      this.logger.attachError(err).error('Error training slot tagger')
      throw Error('Unable to train model')
    }
  }

  protected async trainModels(intentDefs: sdk.NLU.IntentDefinition[], modelHash: string, confusionVersion = undefined) {
    for (const lang of this.languages) {
      try {
        const trainableIntents = intentDefs.filter(i => (i.utterances[lang] || []).length >= MIN_NB_UTTERANCES)
        if (trainableIntents.length) {
          const ctx_intent_models = await this.intentClassifiers[lang].train(trainableIntents, modelHash)
          const slotTaggerModels = await this._trainSlotTagger(
            trainableIntents.filter(intent => intent.slots.length),
            modelHash,
            lang
          )
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

  public computeModelHash(intents: sdk.NLU.IntentDefinition[], entities: sdk.NLU.EntityDefinition[]) {
    const modelData = JSON.stringify({ intents, entities })
    return crypto
      .createHash('md5')
      .update(modelData)
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

    ds.ambiguous =
      ds.intents.length > 1 &&
      allInRange(
        ds.intents.map(i => i.confidence),
        lower,
        upper
      )

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
    const shouldPredict =
      allIntents.length && this.intentClassifiers[ds.language] && this.intentClassifiers[ds.language].isLoaded

    if (!shouldPredict) {
      return ds
    }

    const intents = await this.intentClassifiers[ds.language].predict(
      ds.tokens.map(t => t.canonical),
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

  private _tokenize = async (ds: NLUStructure): Promise<NLUStructure> => {
    ds.tokens = (await this._tokenizeUtterances([ds.rawText.toLowerCase()], ds.language))[0]
    return ds
  }

  private _tokenizeUtterances = async (utterances: string[], language: string) => {
    const rawTokens = await this.languageProvider.tokenize(utterances, language)
    return _.zip(rawTokens, utterances).map(([utteranceTokens, utterance]) => {
      const toks = makeTokens(utteranceTokens, utterance)
      return mergeSpecialCharactersTokens(toks)
    })
  }

  private _extractSlots = async (ds: NLUStructure): Promise<NLUStructure> => {
    if (!ds.intent.name || ds.intent.name === 'none') {
      return ds
    }

    const intentDef = await this.storage.getIntent(ds.intent.name)

    if (!(intentDef.slots && intentDef.slots.length)) {
      return ds
    }

    const intentVocab = await this._buildIntentVocabs([intentDef], ds.language)

    const allowedEntities = getHighlightedIntentEntities(intentDef)
    ds.slots = await this.slotExtractors[ds.language].extract(
      ds,
      intentDef,
      intentVocab,
      allowedEntities,
      this.intentClassifiers[ds.language].l1Tfidf,
      this.intentClassifiers[ds.language].token2vec
    )

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

    const threshold = ds.tokens.length > 1 ? 0.5 : 0.3 // because with single-word sentences (and no history), confidence is always very low

    ds.detectedLanguage = _.get(elected, 'label', NA_LANG)
    ds.language =
      ds.detectedLanguage !== NA_LANG && elected.value > threshold ? ds.detectedLanguage : this.defaultLanguage

    return ds
  }

  private _processText = (ds: NLUStructure): Promise<NLUStructure> => {
    const sanitized = sanitize(ds.rawText)
    ds.sanitizedText = sanitized
    ds.sanitizedLowerText = sanitized.toLowerCase()
    return Promise.resolve(ds)
  }

  private readonly _predictPipeline = [
    this._processText,
    this._detectLang,
    this._tokenize,
    this._extractEntities,
    this._extractIntents,
    this._setAmbiguity,
    this._extractSlots
  ]

  private _buildTrainPipeline = (language: string): PipelineStep2[] => [
    {
      cacheHashAlgorithm: NoneHashAlgorithm,
      execute: this._processText,
      inputProps: ['rawText'],
      outputProps: [] // TODO:
    },
    {
      cacheHashAlgorithm: NoneHashAlgorithm,
      execute: ds => {
        ds.language = language
        return Promise.resolve(ds)
      },
      inputProps: [],
      outputProps: []
    },
    {
      cacheHashAlgorithm: NoneHashAlgorithm,
      execute: this._tokenize,
      inputProps: ['rawText', 'language', 'tokens'],
      outputProps: ['entities']
    },
    {
      cacheHashAlgorithm: DefaultHashAlgorithm,
      execute: this._extractEntities,
      inputProps: ['rawText', 'language', 'tokens'],
      outputProps: ['entities']
    }
  ]
}
