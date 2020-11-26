import { MLToolkit, NLU } from 'botpress/sdk'
import bytes from 'bytes'
import crypto from 'crypto'
import _ from 'lodash'
import LRUCache from 'lru-cache'
import sizeof from 'object-sizeof'

import { EntityCacheManager } from './entities/entity-cache-manager'
import { initializeTools } from './initialize-tools'
import DetectLanguage from './language/language-identifier'
import makeSpellChecker from './language/spell-checker'
import { deserializeModel, PredictableModel, serializeModel } from './model-serializer'
import { Predict, PredictInput, Predictors, PredictOutput } from './predict-pipeline'
import SlotTagger from './slots/slot-tagger'
import { isPatternValid } from './tools/patterns-utils'
import { computeKmeans, ProcessIntents, TrainInput, TrainOutput } from './training-pipeline'
import { TrainingWorkerQueue } from './training-worker-queue'
import { EntityCacheDump, ListEntity, PatternEntity, Tools } from './typings'
import { preprocessRawUtterance } from './utterance/utterance'
import { getModifiedContexts, mergeModelOutputs } from './warm-training-handler'

const trainDebug = DEBUG('nlu').sub('training')

interface LoadedModel {
  model: PredictableModel
  predictors: Predictors
  entityCache: EntityCacheManager
}

const DEFAULT_OPTIONS: Options = {
  maxCacheSize: 262144000 // 250mb of model cache
}

interface Options {
  maxCacheSize: number
}

export default class Engine implements NLU.Engine {
  private _tools!: Tools
  private _trainingWorkerQueue!: TrainingWorkerQueue

  private modelsById: LRUCache<string, LoadedModel>

  constructor(opt?: Partial<Options>) {
    const options: Options = { ...DEFAULT_OPTIONS, ...opt }
    this.modelsById = new LRUCache({
      max: options.maxCacheSize,
      length: sizeof // ignores size of functions, but let's assume it's small
    })
    trainDebug(`model cache size is: ${bytes(options.maxCacheSize)}`)
  }

  public getHealth() {
    return this._tools.getHealth()
  }

  public getLanguages() {
    return this._tools.getLanguages()
  }

  public getVersionInfo() {
    return this._tools.getVersionInfo()
  }

  public async initialize(config: NLU.LanguageConfig, logger: NLU.Logger): Promise<void> {
    this._tools = await initializeTools(config, logger)
    const version = this._tools.getVersionInfo()
    if (!version.nluVersion.length || !version.langServerInfo.version.length) {
      logger.warning('Either the nlu version or the lang server version is not set correctly.')
    }

    this._trainingWorkerQueue = new TrainingWorkerQueue(config, logger)
  }

  public hasModel(modelId: string) {
    return !!this.modelsById.get(modelId)
  }

  public computeModelHash(intents: NLU.IntentDefinition[], entities: NLU.EntityDefinition[], lang: string): string {
    const { nluVersion, langServerInfo } = this._tools.getVersionInfo()

    const singleLangIntents = intents.map(i => ({ ...i, utterances: i.utterances[lang] }))

    return crypto
      .createHash('md5')
      .update(JSON.stringify({ singleLangIntents, entities, nluVersion, langServerInfo }))
      .digest('hex')
  }

  async train(
    trainSessionId: string,
    intentDefs: NLU.IntentDefinition[],
    entityDefs: NLU.EntityDefinition[],
    languageCode: string,
    options: NLU.TrainingOptions
  ): Promise<NLU.Model> {
    trainDebug(`Started ${languageCode} training`)

    const { previousModel: previousModelHash, nluSeed, progressCallback } = options
    const previousModel = previousModelHash ? this.modelsById.get(previousModelHash) : undefined

    const list_entities = entityDefs
      .filter(ent => ent.type === 'list')
      .map(e => {
        return <ListEntity & { cache: EntityCacheDump }>{
          name: e.name,
          fuzzyTolerance: e.fuzzy,
          sensitive: e.sensitive,
          synonyms: _.chain(e.occurrences)
            .keyBy('name')
            .mapValues('synonyms')
            .value(),
          cache: previousModel?.entityCache.getCache(e.name) || []
        }
      })

    const pattern_entities: PatternEntity[] = entityDefs
      .filter(ent => ent.type === 'pattern' && isPatternValid(ent.pattern))
      .map(ent => ({
        name: ent.name,
        pattern: ent.pattern!,
        examples: [], // TODO add this to entityDef
        matchCase: !!ent.matchCase,
        sensitive: !!ent.sensitive
      }))

    const contexts = _.chain(intentDefs)
      .flatMap(i => i.contexts)
      .uniq()
      .value()

    const intents = intentDefs
      .filter(x => !!x.utterances[languageCode])
      .map(x => ({
        name: x.name,
        contexts: x.contexts,
        utterances: x.utterances[languageCode],
        slot_definitions: x.slots
      }))

    let ctxToTrain = contexts
    if (previousModel) {
      const previousIntents = previousModel.model.data.input.intents
      const contextChangeLog = getModifiedContexts(intents, previousIntents)
      ctxToTrain = [...contextChangeLog.createdContexts, ...contextChangeLog.modifiedContexts]
    }

    const debugMsg = previousModel
      ? `Training all contexts for language: ${languageCode}`
      : `Retraining only contexts: [${ctxToTrain}] for language: ${languageCode}`
    trainDebug(debugMsg)

    const input: TrainInput = {
      nluSeed,
      languageCode,
      list_entities,
      pattern_entities,
      contexts,
      intents,
      ctxToTrain
    }

    const startedAt = new Date()
    const output = await this._trainingWorkerQueue.startTraining(trainSessionId, input, progressCallback)

    const hash = this.computeModelHash(intentDefs, entityDefs, languageCode)
    const model: PredictableModel = {
      startedAt,
      finishedAt: new Date(),
      languageCode: input.languageCode,
      hash,
      seed: nluSeed,
      data: {
        input,
        output
      }
    }

    if (previousModel) {
      model.data.output = mergeModelOutputs(model.data.output, previousModel.model.data.output, contexts)
    }

    trainDebug(`Successfully finished ${languageCode} training`)

    return serializeModel(model)
  }

  cancelTraining(trainSessionId: string): Promise<void> {
    return this._trainingWorkerQueue.cancelTraining(trainSessionId)
  }

  async loadModel(serialized: NLU.Model, modelId: string) {
    trainDebug(`Load model ${modelId}`)
    if (this.hasModel(modelId)) {
      trainDebug(`Model ${modelId} already loaded.`)
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
    trainDebug(`Size of model #${modelId} is ${bytes(modelSize)}`)

    if (modelSize >= this.modelsById.max) {
      const msg = `Can't load model ${modelId} as it is bigger than the maximum allowed size`
      const details = `model size: ${bytes(modelSize)}, max allowed: ${bytes(this.modelsById.max)}`
      throw new Error(`${msg} (${details}).`)
    }

    this.modelsById.set(modelId, modelCacheItem)
    trainDebug('Model loaded with success')
    trainDebug(`Model cache entries are: [${this.modelsById.keys().join(', ')}]`)
  }

  private _makeCacheManager(output: TrainOutput) {
    const cacheManager = new EntityCacheManager()
    const { list_entities } = output
    cacheManager.loadFromData(list_entities)
    return cacheManager
  }

  private async _makePredictors(input: TrainInput, output: TrainOutput): Promise<Predictors> {
    const tools = this._tools

    /**
     * TODO: extract this function some place else,
     * Engine's predict() shouldn't be dependant of training pipeline...
     */
    const intents = await ProcessIntents(input.intents, input.languageCode, output.list_entities, this._tools)

    const basePredictors: Predictors = {
      ...output,
      lang: input.languageCode,
      intents,
      pattern_entities: input.pattern_entities
    }

    if (_.flatMap(input.intents, i => i.utterances).length <= 0) {
      // we don't want to return undefined as extraction won't be triggered
      // we want to make it possible to extract entities without having any intents
      return basePredictors
    }

    const { ctx_model, intent_model_by_ctx, oos_model } = output
    const ctx_classifier = ctx_model ? new tools.mlToolkit.SVM.Predictor(ctx_model) : undefined
    const intent_classifier_per_ctx = _.toPairs(intent_model_by_ctx).reduce(
      (c, [ctx, intentModel]) => ({ ...c, [ctx]: new tools.mlToolkit.SVM.Predictor(intentModel as string) }),
      {} as _.Dictionary<MLToolkit.SVM.Predictor>
    )
    const oos_classifier = _.toPairs(oos_model).reduce(
      (c, [ctx, mod]) => ({ ...c, [ctx]: new tools.mlToolkit.SVM.Predictor(mod) }),
      {} as _.Dictionary<MLToolkit.SVM.Predictor>
    )

    let slot_tagger: SlotTagger | undefined
    if (output.slots_model.length) {
      slot_tagger = new SlotTagger(tools.mlToolkit)
      slot_tagger.load(output.slots_model)
    }

    const kmeans = computeKmeans(intents!, tools) // TODO load from artefacts when persisted

    return {
      ...basePredictors,
      ctx_classifier,
      oos_classifier_per_ctx: oos_classifier,
      intent_classifier_per_ctx,
      slot_tagger,
      kmeans
    }
  }

  async predict(sentence: string, includedContexts: string[], modelId: string): Promise<PredictOutput> {
    const loaded = this.modelsById.get(modelId)
    if (!loaded) {
      throw new Error(`model ${modelId} not loaded`)
    }

    const language = loaded.model.languageCode
    const input: PredictInput = {
      language,
      sentence,
      includedContexts
    }

    return Predict(input, this._tools, loaded.predictors)
  }

  async spellCheck(sentence: string, modelId: string) {
    const loaded = this.modelsById.get(modelId)
    if (!loaded) {
      throw new Error(`model ${modelId} not loaded`)
    }

    const preprocessed = preprocessRawUtterance(sentence)
    const spellChecker = makeSpellChecker(
      Object.keys(loaded.predictors.vocabVectors),
      loaded.model.languageCode,
      this._tools
    )
    return spellChecker(preprocessed)
  }

  async detectLanguage(text: string, modelsByLang: _.Dictionary<string>): Promise<string> {
    trainDebug(`Detecting language for input: "${text}"`)

    const predictorsByLang = _.mapValues(modelsByLang, id => this.modelsById.get(id)?.predictors)
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
