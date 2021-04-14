import bytes from 'bytes'
import _ from 'lodash'
import LRUCache from 'lru-cache'
import { isListEntity, isPatternEntity } from 'nlu/utils/guards'
import sizeof from 'object-sizeof'

import v8 from 'v8'

import modelIdService from '../model-id-service'

import {
  TrainingOptions,
  LanguageConfig,
  Logger,
  ModelId,
  TrainingSet,
  Model,
  PredictOutput,
  Engine as IEngine
} from '../typings'
import { deserializeKmeans } from './clustering'
import { EntityCacheManager } from './entities/entity-cache-manager'
import { initializeTools } from './initialize-tools'
import { getCtxFeatures } from './intents/context-featurizer'
import { OOSIntentClassifier } from './intents/oos-intent-classfier'
import { SvmIntentClassifier } from './intents/svm-intent-classifier'
import DetectLanguage from './language/language-identifier'
import { deserializeModel, PredictableModel, serializeModel } from './model-serializer'
import { Predict, Predictors } from './predict-pipeline'
import SlotTagger from './slots/slot-tagger'
import { isPatternValid } from './tools/patterns-utils'
import { TrainInput, TrainOutput } from './training-pipeline'
import { TrainingWorkerQueue } from './training-worker-queue'
import { EntityCacheDump, ListEntity, PatternEntity, Tools } from './typings'
import { getModifiedContexts, mergeModelOutputs } from './warm-training-handler'

const trainDebug = DEBUG('nlu').sub('training')
const lifecycleDebug = DEBUG('nlu').sub('lifecycle')
const debugPredict = DEBUG('nlu').sub('extract')

interface LoadedModel {
  model: PredictableModel
  predictors: Predictors
  entityCache: EntityCacheManager
}

const DEFAULT_CACHE_SIZE = '850mb'
const DEFAULT_ENGINE_OPTIONS: EngineOptions = {
  cacheSize: DEFAULT_CACHE_SIZE,
  legacyElection: false
}

const DEFAULT_TRAINING_OPTIONS: TrainingOptions = {
  progressCallback: () => {},
  previousModel: undefined
}

interface EngineOptions {
  cacheSize: string
  legacyElection: boolean
}

export default class Engine implements IEngine {
  private _tools!: Tools
  private _trainingWorkerQueue!: TrainingWorkerQueue

  private _options: EngineOptions

  private modelsById: LRUCache<string, LoadedModel>

  constructor(opt: Partial<EngineOptions> = {}) {
    this._options = { ...DEFAULT_ENGINE_OPTIONS, ...opt }

    this.modelsById = new LRUCache({
      max: this._parseCacheSize(this._options.cacheSize),
      length: sizeof // ignores size of functions, but let's assume it's small
    })

    const debugMsg =
      this.modelsById.max === Infinity
        ? 'model cache size is infinite'
        : `model cache size is: ${bytes(this.modelsById.max)}`
    lifecycleDebug(debugMsg)
  }

  private _parseCacheSize = (cacheSize: string): number => {
    const defaultBytes = bytes(DEFAULT_CACHE_SIZE)
    if (!cacheSize) {
      return defaultBytes
    }

    const parsedCacheSize = bytes(cacheSize)
    if (!parsedCacheSize) {
      return defaultBytes
    }

    return Math.abs(parsedCacheSize)
  }

  public getHealth() {
    return this._tools.getHealth()
  }

  public getLanguages() {
    return this._tools.getLanguages()
  }

  public getSpecifications() {
    return this._tools.getSpecifications()
  }

  public async initialize(config: LanguageConfig, logger: Logger): Promise<void> {
    this._tools = await initializeTools(config, logger)
    const { nluVersion, languageServer } = this._tools.getSpecifications()
    if (!_.isString(nluVersion) || !this._dictionnaryIsFilled(languageServer)) {
      logger.warning('Either the nlu version or the lang server version is not set correctly.')
    }

    this._trainingWorkerQueue = new TrainingWorkerQueue(config, logger)
  }

  public hasModel(modelId: ModelId) {
    const stringId = modelIdService.toString(modelId)
    return !!this.modelsById.get(stringId)
  }

  async train(trainId: string, trainSet: TrainingSet, opt: Partial<TrainingOptions> = {}): Promise<Model> {
    const { languageCode, seed, entityDefs, intentDefs } = trainSet
    trainDebug(`[${trainId}] Started ${languageCode} training`)

    const options = { ...DEFAULT_TRAINING_OPTIONS, ...opt }

    const { previousModel: previousModelId, progressCallback } = options
    const previousModel = previousModelId && this.modelsById.get(modelIdService.toString(previousModelId))

    const list_entities = entityDefs.filter(isListEntity).map(e => {
      return <ListEntity & { cache: EntityCacheDump }>{
        name: e.name,
        fuzzyTolerance: e.fuzzy,
        sensitive: e.sensitive,
        synonyms: _.chain(e.values)
          .keyBy(e => e.name)
          .mapValues(e => e.synonyms)
          .value(),
        cache: previousModel?.entityCache.getCache(e.name) || []
      }
    })

    const pattern_entities: PatternEntity[] = entityDefs
      .filter(isPatternEntity)
      .filter(ent => isPatternValid(ent.regex))
      .map(ent => ({
        name: ent.name,
        pattern: ent.regex,
        examples: ent.examples,
        matchCase: ent.case_sensitive,
        sensitive: !!ent.sensitive
      }))

    const contexts = _.chain(intentDefs)
      .flatMap(i => i.contexts)
      .uniq()
      .value()

    const intents = intentDefs
      .filter(x => !!x.utterances)
      .map(x => ({
        name: x.name,
        contexts: x.contexts,
        utterances: x.utterances,
        slot_definitions: x.slots
      }))

    let ctxToTrain = contexts
    if (previousModel) {
      const previousIntents = previousModel.model.data.input.intents
      const contextChangeLog = getModifiedContexts(intents, previousIntents)
      ctxToTrain = [...contextChangeLog.createdContexts, ...contextChangeLog.modifiedContexts]
    }

    const debugMsg = previousModel
      ? `Retraining only contexts: [${ctxToTrain}] for language: ${languageCode}`
      : `Training all contexts for language: ${languageCode}`
    trainDebug(`[${trainId}] ${debugMsg}`)

    const input: TrainInput = {
      trainId,
      nluSeed: seed,
      languageCode,
      list_entities,
      pattern_entities,
      contexts,
      intents,
      ctxToTrain
    }

    const startedAt = new Date()
    const output = await this._trainingWorkerQueue.startTraining(input, progressCallback)

    const modelId = modelIdService.makeId({
      ...trainSet,
      specifications: this.getSpecifications()
    })

    const model: PredictableModel = {
      id: modelId,
      startedAt,
      finishedAt: new Date(),
      data: {
        input,
        output
      }
    }

    if (previousModel) {
      model.data.output = mergeModelOutputs(model.data.output, previousModel.model.data.output, contexts)
    }

    trainDebug(`[${trainId}] Successfully finished ${languageCode} training`)

    return serializeModel(model)
  }

  cancelTraining(trainSessionId: string): Promise<void> {
    return this._trainingWorkerQueue.cancelTraining(trainSessionId)
  }

  async loadModel(serialized: Model) {
    const stringId = modelIdService.toString(serialized.id)
    lifecycleDebug(`Load model ${stringId}`)

    if (this.hasModel(serialized.id)) {
      lifecycleDebug(`Model ${stringId} already loaded.`)
      return
    }

    const model = deserializeModel(serialized)
    const { input, output } = model.data

    const modelCacheItem: LoadedModel = {
      model,
      predictors: await this._makePredictors(input, output),
      entityCache: this._makeCacheManager(output)
    }

    const modelSize = sizeof(modelCacheItem)
    const bytesModelSize = bytes(modelSize)
    lifecycleDebug(`Size of model ${stringId} is ${bytesModelSize}`)

    if (modelSize >= this.modelsById.max) {
      const msg = `Can't load model ${stringId} as it is bigger than the maximum allowed size`
      const details = `model size: ${bytes(modelSize)}, max allowed: ${bytes(this.modelsById.max)}`
      const solution = 'You can increase cache size in the nlu config.'
      throw new Error(`${msg} (${details}). ${solution}`)
    }

    this.modelsById.set(stringId, modelCacheItem)

    lifecycleDebug(`Model cache entries are: [${this.modelsById.keys().join(', ')}]`)
    const debug = this._getMemoryUsage()
    lifecycleDebug(`Current memory usage: ${JSON.stringify(debug)}`)
  }

  private _getMemoryUsage = () => {
    const { heap_size_limit, total_available_size, used_heap_size } = v8.getHeapStatistics()
    return _.mapValues(
      {
        currentCacheSize: this.modelsById.length,
        heap_size_limit,
        total_available_size,
        used_heap_size
      },
      bytes
    )
  }

  unloadModel(modelId: ModelId) {
    const stringId = modelIdService.toString(modelId)
    lifecycleDebug(`Unload model ${stringId}`)

    if (!this.hasModel(modelId)) {
      lifecycleDebug(`No model with id ${stringId} was found in cache.`)
      return
    }

    this.modelsById.del(stringId)
    lifecycleDebug('Model unloaded with success')
  }

  private _makeCacheManager(output: TrainOutput) {
    const cacheManager = new EntityCacheManager()
    const { list_entities } = output
    cacheManager.loadFromData(list_entities)
    return cacheManager
  }

  private async _makePredictors(input: TrainInput, output: TrainOutput): Promise<Predictors> {
    const tools = this._tools

    const { intents, languageCode, pattern_entities, contexts } = input
    const { ctx_model, intent_model_by_ctx, kmeans, slots_model_by_intent, tfidf, vocab, list_entities } = output

    const warmKmeans = kmeans && deserializeKmeans(kmeans)

    const intent_classifier_per_ctx: Dic<OOSIntentClassifier> = await Promise.props(
      _.mapValues(intent_model_by_ctx, async model => {
        const { legacyElection } = this._options
        const intentClf = new OOSIntentClassifier(tools, undefined, { legacyElection })
        await intentClf.load(model)
        return intentClf
      })
    )

    const ctx_classifier = new SvmIntentClassifier(tools, getCtxFeatures)
    await ctx_classifier.load(ctx_model)

    const slot_tagger_per_intent: Dic<SlotTagger> = await Promise.props(
      _.mapValues(slots_model_by_intent, async model => {
        const slotTagger = new SlotTagger(tools)
        await slotTagger.load(model)
        return slotTagger
      })
    )

    return {
      contexts,
      tfidf,
      vocab,
      lang: languageCode,
      intents,
      pattern_entities,
      list_entities,
      kmeans: warmKmeans,
      intent_classifier_per_ctx,
      ctx_classifier,
      slot_tagger_per_intent
    }
  }

  async predict(text: string, modelId: ModelId): Promise<PredictOutput> {
    debugPredict(`Predict for input: "${text}"`)

    const stringId = modelIdService.toString(modelId)
    const loaded = this.modelsById.get(stringId)
    if (!loaded) {
      throw new Error(`model ${stringId} not loaded`)
    }

    const language = loaded.model.id.languageCode
    return Predict(
      {
        language,
        text
      },
      this._tools,
      loaded.predictors
    )
  }

  async detectLanguage(text: string, modelsByLang: _.Dictionary<ModelId>): Promise<string> {
    debugPredict(`Detecting language for input: "${text}"`)

    const predictorsByLang = _.mapValues(modelsByLang, id => {
      const stringId = modelIdService.toString(id)
      return this.modelsById.get(stringId)?.predictors
    })

    if (!this._dictionnaryIsFilled(predictorsByLang)) {
      const missingLangs = _(predictorsByLang)
        .pickBy(pred => _.isUndefined(pred))
        .keys()
        .value()
      throw new Error(`No models loaded for the following languages: [${missingLangs.join(', ')}]`)
    }
    return DetectLanguage(text, predictorsByLang, this._tools)
  }

  // TODO: this should go someplace else, but I find it very handy
  private _dictionnaryIsFilled = <T>(dictionnary: { [key: string]: T | undefined }): dictionnary is Dic<T> => {
    return !Object.values(dictionnary).some(_.isUndefined)
  }
}
