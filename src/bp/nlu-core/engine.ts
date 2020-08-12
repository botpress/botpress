import { MLToolkit, NLU } from 'botpress/sdk'
import crypto from 'crypto'
import _ from 'lodash'

import * as CacheManager from '../core/services/nlu/cache-manager'

import { initializeTools } from './initialize-tools'
import { deserializeModel, PredictableModel, serializeModel } from './model-manager'
import { Predict, PredictInput, Predictors, PredictOutput } from './predict-pipeline'
import SlotTagger from './slots/slot-tagger'
import { isPatternValid } from './tools/patterns-utils'
import { computeKmeans, ProcessIntents, Trainer, TrainInput, TrainOutput } from './training-pipeline'
import { EntityCacheDump, Intent, ListEntity, ListEntityModel, PatternEntity, Tools } from './typings'

const trainDebug = DEBUG('nlu').sub('training')

export default class Engine implements NLU.Engine {
  private static _tools: Tools
  private static _version: NLUVersionInfo

  private predictorsByLang: _.Dictionary<Predictors> = {}
  private modelsByLang: _.Dictionary<PredictableModel> = {}

  constructor(private defaultLanguage: string, private botId: string, private logger: NLU.Logger) {}

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
  }

  // we might want to make this language specific
  public computeModelHash(
    intents: NLU.IntentDefinition[],
    entities: NLU.EntityDefinition[],
    version: NLUVersionInfo,
    lang: string
  ): string {
    const { nluVersion, langServerInfo } = version

    const singleLangIntents = intents.map(i => ({ ...i, utterances: i.utterances[lang] }))

    return crypto
      .createHash('md5')
      .update(JSON.stringify({ singleLangIntents, entities, nluVersion, langServerInfo }))
      .digest('hex')
  }

  async train(
    intentDefs: NLU.IntentDefinition[],
    entityDefs: NLU.EntityDefinition[],
    languageCode: string,
    reportTrainingProgress?: NLU.ProgressReporter,
    trainingSession?: NLU.TrainingSession,
    options?: NLU.TrainingOptions
  ): Promise<NLU.Model | undefined> {
    trainDebug.forBot(this.botId, `Started ${languageCode} training`)

    const list_entities = entityDefs
      .filter(ent => ent.type === 'list')
      .map(e => {
        return {
          name: e.name,
          fuzzyTolerance: e.fuzzy,
          sensitive: e.sensitive,
          synonyms: _.chain(e.occurrences)
            .keyBy('name')
            .mapValues('synonyms')
            .value()
        } as ListEntity
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

    const previousModel = this.modelsByLang[languageCode]
    let trainAllCtx = options?.forceTrain || !previousModel
    let ctxToTrain = contexts

    if (!trainAllCtx) {
      const previousIntents = previousModel.data.input.intents
      const ctxHasChanged = this._ctxHasChanged(previousIntents, intents)
      const modifiedCtx = contexts.filter(ctxHasChanged)

      trainAllCtx = modifiedCtx.length === contexts.length
      ctxToTrain = trainAllCtx ? contexts : modifiedCtx
    }

    const debugMsg = trainAllCtx
      ? `Training all contexts for language: ${languageCode}`
      : `Retraining only contexts: [${ctxToTrain}] for language: ${languageCode}`
    trainDebug.forBot(this.botId, debugMsg)

    const input: TrainInput = {
      botId: this.botId,
      trainingSession,
      languageCode,
      list_entities,
      pattern_entities,
      contexts,
      intents,
      ctxToTrain
    }

    const hash = this.computeModelHash(intentDefs, entityDefs, Engine._version, languageCode)
    const model = await this._trainAndMakeModel(input, hash, reportTrainingProgress)
    if (!model) {
      return
    }

    if (!trainAllCtx) {
      model.data.output = _.merge({}, previousModel.data.output, model.data.output)
      model.data.output.slots_model = new Buffer(model.data.output.slots_model) // lodash merge messes up buffers
    }

    trainingSession &&
      reportTrainingProgress?.(this.botId, 'Training complete', {
        ...trainingSession,
        progress: 1,
        status: 'done'
      })

    trainDebug.forBot(this.botId, `Successfully finished ${languageCode} training`)

    return serializeModel(model)
  }

  private async _trainAndMakeModel(
    input: TrainInput,
    hash: string,
    reportTrainingProgress?: NLU.ProgressReporter
  ): Promise<PredictableModel | undefined> {
    const startedAt = new Date()
    let output: TrainOutput | undefined
    try {
      output = await Trainer(input, Engine._tools, reportTrainingProgress)
    } catch (err) {
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

    if (!output.intents) {
      const intents = await ProcessIntents(input.intents, model.languageCode, output.list_entities, Engine._tools)
      output.intents = intents
    }
    const trainOutput = output as TrainOutput

    this._warmEntitiesCaches(model.data.output.list_entities ?? [])
    this.predictorsByLang[model.languageCode] = await this._makePredictors(input, trainOutput)
    this.modelsByLang[model.languageCode] = model
  }

  private _warmEntitiesCaches(listEntities: ListEntityModel[]) {
    for (const entity of listEntities) {
      if (!entity.cache) {
        // when loading a model trained in a previous version
        entity.cache = CacheManager.getOrCreateCache(entity.entityName, this.botId)
      }
      if (CacheManager.isCacheDump(entity.cache)) {
        entity.cache = CacheManager.loadCacheFromData(<EntityCacheDump>entity.cache, entity.entityName, this.botId)
      }
    }
  }

  private async _makePredictors(input: TrainInput, output: TrainOutput): Promise<Predictors> {
    const tools = Engine._tools

    if (_.flatMap(input.intents, i => i.utterances).length <= 0) {
      // we don't want to return undefined as extraction won't be triggered
      // we want to make it possible to extract entities without having any intents
      return {
        ...output,
        pattern_entities: input.pattern_entities
      }
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
    const slot_tagger = new SlotTagger(tools.mlToolkit)
    slot_tagger.load(output.slots_model)

    const kmeans = computeKmeans(output.intents!, tools) // TODO load from artefacts when persisted

    return {
      ...output,
      ctx_classifier,
      oos_classifier_per_ctx: oos_classifier,
      intent_classifier_per_ctx,
      slot_tagger,
      kmeans,
      pattern_entities: input.pattern_entities
    }
  }

  async predict(sentence: string, includedContexts: string[]): Promise<PredictOutput> {
    const input: PredictInput = {
      defaultLanguage: this.defaultLanguage,
      sentence,
      includedContexts
    }

    // error handled a level higher
    return Predict(input, Engine._tools, this.predictorsByLang)
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
