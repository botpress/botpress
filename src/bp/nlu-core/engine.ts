import { MLToolkit, NLU } from 'botpress/sdk'
import crypto from 'crypto'
import _ from 'lodash'

import { EntityCacheManager } from './entities/entity-cache-manager'
import { initializeTools } from './initialize-tools'
import DetectLanguage from './language/language-identifier'
import { deserializeModel, PredictableModel, serializeModel } from './model-manager'
import { Predict, PredictInput, Predictors, PredictOutput } from './predict-pipeline'
import SlotTagger from './slots/slot-tagger'
import { isPatternValid } from './tools/patterns-utils'
import { computeKmeans, ProcessIntents, TrainInput, TrainOutput } from './training-pipeline'
import { TrainingCanceledError, TrainingWorkerQueue } from './training-worker-queue'
import { EntityCacheDump, Intent, ListEntity, PatternEntity, Tools } from './typings'

const trainDebug = DEBUG('nlu').sub('training')

export default class Engine implements NLU.Engine {
  private static _tools: Tools
  private static _trainingWorkerQueue: TrainingWorkerQueue

  private predictorsByLang: _.Dictionary<Predictors> = {}
  private modelsByLang: _.Dictionary<PredictableModel> = {}
  private entitiesCacheByLang: _.Dictionary<EntityCacheManager> = {}

  constructor(private botId: string, private logger: NLU.Logger) {}

  // NOTE: removed private in order to prevent important refactor (which will be done later)
  public static get tools() {
    return this._tools
  }

  public static getHealth() {
    return this._tools.getHealth()
  }

  public static getLanguages() {
    return this._tools.getLanguages()
  }

  public static getVersionInfo() {
    return this._tools.getVersionInfo()
  }

  public static async initialize(config: NLU.Config, logger: NLU.Logger): Promise<void> {
    this._tools = await initializeTools(config, logger)
    const version = this._tools.getVersionInfo()
    if (!version.nluVersion.length || !version.langServerInfo.version.length) {
      logger.warning('Either the nlu version or the lang server version is not set correctly.')
    }

    this._trainingWorkerQueue = new TrainingWorkerQueue(config, logger)
  }

  public hasModel(language: string, hash: string) {
    return this.modelsByLang[language]?.hash === hash
  }

  public hasModelForLang(language: string) {
    return !!this.modelsByLang[language]
  }

  // we might want to make this language specific
  public computeModelHash(intents: NLU.IntentDefinition[], entities: NLU.EntityDefinition[], lang: string): string {
    const { nluVersion, langServerInfo } = Engine._tools.getVersionInfo()

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
  ): Promise<NLU.Model | undefined> {
    trainDebug.forBot(this.botId, `Started ${languageCode} training`)

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
          cache: this.entitiesCacheByLang[languageCode]?.getCache(e.name) || []
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

    const { forceTrain, nluSeed, progressCallback } = options

    const previousModel = this.modelsByLang[languageCode]
    let trainAllCtx = forceTrain || !previousModel
    let ctxToTrain = contexts

    if (!trainAllCtx) {
      const previousIntents = previousModel.data.input.intents
      const ctxHasChanged = this._ctxHasChanged(previousIntents, intents)
      const modifiedCtx = contexts.filter(ctxHasChanged)

      trainAllCtx = modifiedCtx.length >= contexts.length
      ctxToTrain = trainAllCtx ? contexts : modifiedCtx
    }

    const debugMsg = trainAllCtx
      ? `Training all contexts for language: ${languageCode}`
      : `Retraining only contexts: [${ctxToTrain}] for language: ${languageCode}`
    trainDebug.forBot(this.botId, debugMsg)

    const input: TrainInput = {
      botId: this.botId,
      nluSeed,
      languageCode,
      list_entities,
      pattern_entities,
      contexts,
      intents,
      ctxToTrain
    }

    const hash = this.computeModelHash(intentDefs, entityDefs, languageCode)
    const model = await this._trainAndMakeModel(trainSessionId, input, hash, progressCallback)

    if (!model) {
      return
    }

    if (!trainAllCtx) {
      model.data.output = this._mergeModelOutputs(model.data.output, previousModel.data.output, contexts)
    }

    trainDebug.forBot(this.botId, `Successfully finished ${languageCode} training`)

    return serializeModel(model)
  }

  cancelTraining(trainSessionId: string): Promise<void> {
    return Engine._trainingWorkerQueue.cancelTraining(trainSessionId)
  }

  private _mergeModelOutputs(
    currentOutput: TrainOutput,
    previousOutput: TrainOutput,
    allContexts: string[]
  ): TrainOutput {
    const output = { ...currentOutput }

    const previousIntents = _.pick(previousOutput.intent_model_by_ctx, allContexts)
    const previousOOS = _.pick(previousOutput.oos_model, allContexts)

    output.intent_model_by_ctx = { ...previousIntents, ...currentOutput.intent_model_by_ctx }
    output.oos_model = { ...previousOOS, ...currentOutput.oos_model }
    return output
  }

  private async _trainAndMakeModel(
    trainSessionId: string,
    input: TrainInput,
    hash: string,
    progressCallback: (progress: number) => void
  ): Promise<PredictableModel | undefined> {
    const startedAt = new Date()
    let output: TrainOutput | undefined

    try {
      output = await Engine._trainingWorkerQueue.startTraining(trainSessionId, input, progressCallback)
    } catch (err) {
      if (err instanceof TrainingCanceledError) {
        this.logger.info('Training cancelled')
        return
      }
      this.logger.error('Could not finish training NLU model', err)
      return
    }

    if (!output) {
      return
    }

    return {
      startedAt,
      finishedAt: new Date(),
      languageCode: input.languageCode,
      hash,
      data: {
        input,
        output
      }
    }
  }

  private modelAlreadyLoaded(model: NLU.Model) {
    if (!model?.languageCode) {
      return false
    }
    const lang = model.languageCode

    return (
      !!this.predictorsByLang[lang] &&
      !!this.modelsByLang[lang] &&
      !!this.modelsByLang[lang].hash &&
      !!model.hash &&
      this.modelsByLang[lang].hash === model.hash
    )
  }

  async loadModel(serialized: NLU.Model | undefined) {
    if (!serialized || this.modelAlreadyLoaded(serialized)) {
      return
    }

    const model = deserializeModel(serialized)

    const { input, output } = model.data

    const trainOutput = output as TrainOutput

    const { languageCode } = model
    this.predictorsByLang[languageCode] = await this._makePredictors(input, trainOutput)
    this.entitiesCacheByLang[languageCode] = this._makeCacheManager(trainOutput)
    this.modelsByLang[languageCode] = model
  }

  private _makeCacheManager(output: TrainOutput) {
    const cacheManager = new EntityCacheManager()
    const { list_entities } = output
    cacheManager.loadFromData(list_entities)
    return cacheManager
  }

  private async _makePredictors(input: TrainInput, output: TrainOutput): Promise<Predictors> {
    const tools = Engine._tools

    /**
     * TODO: extract this function some place else,
     * Engine shouldn't be dependant of training pipeline...
     */
    const intents = await ProcessIntents(input.intents, input.languageCode, output.list_entities, Engine._tools)

    const basePredictors: Predictors = {
      ...output,
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

  async predict(sentence: string, includedContexts: string[], language: string): Promise<PredictOutput> {
    const input: PredictInput = {
      language,
      sentence,
      includedContexts
    }

    // error handled a level higher
    return Predict(input, Engine._tools, this.predictorsByLang)
  }

  unloadModel(lang: string) {
    if (this.modelsByLang[lang]) {
      delete this.modelsByLang[lang]
      delete this.predictorsByLang[lang]
    }
  }

  async detectLanguage(sentence: string): Promise<string> {
    return DetectLanguage(sentence, this.predictorsByLang, Engine._tools)
  }

  private _ctxHasChanged = (previousIntents: Intent<string>[], currentIntents: Intent<string>[]) => (ctx: string) => {
    const prevHash = this._computeCtxHash(previousIntents, ctx)
    const currHash = this._computeCtxHash(currentIntents, ctx)
    return prevHash !== currHash
  }

  private _computeCtxHash = (intents: Intent<string>[], ctx: string) => {
    const intentsOfCtx = intents.filter(i => i.contexts.includes(ctx))
    return crypto
      .createHash('md5')
      .update(JSON.stringify(intentsOfCtx))
      .digest('hex')
  }
}
