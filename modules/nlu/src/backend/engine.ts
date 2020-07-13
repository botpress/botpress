import { MLToolkit, NLU } from 'botpress/sdk'
import _ from 'lodash'
import crypto from 'crypto'

import * as CacheManager from './cache-manager'
import { computeModelHash, Model } from './model-service'
import { Predict, PredictInput, Predictors, PredictOutput } from './predict-pipeline'
import SlotTagger from './slots/slot-tagger'
import { isPatternValid } from './tools/patterns-utils'
import { computeKmeans, ProcessIntents, Trainer, TrainInput, TrainStep, TrainOutput } from './training-pipeline'
import {
  EntityCacheDump,
  ListEntity,
  ListEntityModel,
  NLUEngine,
  Tools,
  TrainingSession,
  NLUVersionInfo,
  Intent,
  TrainingCanceledError
} from './typings'

const trainDebug = DEBUG('nlu').sub('training')

export type TrainingOptions = {
  forceTrain: boolean
}

export default class Engine implements NLUEngine {
  // NOTE: removed private in order to prevent important refactor (which will be done later)
  static tools: Tools
  private predictorsByLang: _.Dictionary<Predictors> = {}
  private modelsByLang: _.Dictionary<Model> = {}

  constructor(private defaultLanguage: string, private botId: string, private version: NLUVersionInfo) { }

  static provideTools(tools: Tools) {
    Engine.tools = tools
  }

  async train(
    intentDefs: NLU.IntentDefinition[],
    entityDefs: NLU.EntityDefinition[],
    languageCode: string,
    trainingSession?: TrainingSession,
    options?: TrainingOptions
  ): Promise<Model> {
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

    const pattern_entities = entityDefs
      .filter(ent => ent.type === 'pattern' && isPatternValid(ent.pattern))
      .map(ent => ({
        name: ent.name,
        pattern: ent.pattern,
        examples: [], // TODO add this to entityDef
        matchCase: ent.matchCase,
        sensitive: ent.sensitive
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

    let model: Partial<Model> = {
      startedAt: new Date(),
      languageCode: input.languageCode,
      data: {
        input
      }
    }

    try {
      const artefacts = await Trainer(input, Engine.tools)
      model.success = true
      _.merge(model, { success: true, data: { artefacts } })
    } catch (err) {
      model.success = false

      if (err instanceof TrainingCanceledError) {
        trainDebug.forBot(input.botId, 'Training aborted')
      } else {
        trainDebug.forBot(input.botId, `Could not finish training NLU model \n ${err}`)
      }
    } finally {
      model.finishedAt = new Date()
    }

    if (!trainAllCtx) {
      model = this._mergeModels(previousModel, model as Model)
    }

    model.hash = computeModelHash(intentDefs, entityDefs, this.version, model.languageCode)
    if (model.success) {
      trainingSession &&
        Engine.tools.reportTrainingProgress(this.botId, 'Training complete', {
          ...trainingSession,
          progress: 1,
          status: 'done'
        })
      trainDebug.forBot(this.botId, `Successfully finished ${languageCode} training`)
    }
    return model as Model
  }

  private modelAlreadyLoaded(model: Model) {
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

  async loadModel(model: Model) {
    if (this.modelAlreadyLoaded(model)) {
      return
    }
    if (!model.data.output) {
      const intents = await ProcessIntents(
        model.data.input.intents,
        model.languageCode,
        model.data.output.list_entities,
        Engine.tools
      )
      model.data.output.intents = intents
    }

    this._warmEntitiesCaches(_.get(model, 'data.artefacts.list_entities', []))
    this.predictorsByLang[model.languageCode] = await this._makePredictors(model)
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

  private async _makePredictors(model: Model): Promise<Predictors> {
    const { input, output } = model.data
    const tools = Engine.tools

    if (_.flatMap(input.intents, i => i.utterances).length <= 0) {
      // we don't want to return undefined as extraction won't be triggered
      // we want to make it possible to extract entities without having any intents
      return { ...output, contexts: [], intents: [], pattern_entities: input.pattern_entities } as Predictors
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

    const kmeans = computeKmeans(output.intents, tools) // TODO load from artefacts when persisted

    return {
      ...output,
      ctx_classifier,
      oos_classifier_per_ctx: oos_classifier,
      intent_classifier_per_ctx,
      slot_tagger,
      kmeans,
      pattern_entities: input.pattern_entities,
      intents: output.intents,
      contexts: input.contexts
    }
  }

  async predict(sentence: string, includedContexts: string[]): Promise<PredictOutput> {
    const input: PredictInput = {
      defaultLanguage: this.defaultLanguage,
      sentence,
      includedContexts
    }

    // error handled a level highr
    return Predict(input, Engine.tools, this.predictorsByLang)
  }

  private _mergeModels(previousModel: Model, trainingOuput: Model) {
    const previousModelDatas = previousModel.data
    const currentModelDatas = trainingOuput.data
    if (!previousModelDatas || !currentModelDatas) {
      return previousModel
    }

    const artefacts = _.merge({}, previousModelDatas, currentModelDatas)
    const mergedModel = _.merge({}, trainingOuput, { data: { artefacts } })

    // lodash merge messes up buffers objects
    mergedModel.data.output.slots_model = new Buffer(mergedModel.data.output.slots_model)
    return mergedModel
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
