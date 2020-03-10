import { MLToolkit, NLU } from 'botpress/sdk'
import _ from 'lodash'

import { isPOSAvailable } from './language/pos-tagger'
import { computeModelHash, Model } from './model-service'
import { Predict, PredictInput, Predictors, PredictOutput } from './predict-pipeline'
import SlotTagger from './slots/slot-tagger'
import { isPatternValid } from './tools/patterns-utils'
import { computeKmeans, ProcessIntents, Trainer, TrainInput, TrainOutput } from './training-pipeline'
import { ListEntity, NLUEngine, Tools, TrainingSession } from './typings'

const trainDebug = DEBUG('nlu').sub('training')

export default class Engine implements NLUEngine {
  // NOTE: removed private in order to prevent important refactor (which will be done later)
  static tools: Tools
  private predictorsByLang: _.Dictionary<Predictors> = {}
  private modelsByLang: _.Dictionary<Model> = {}

  constructor(private defaultLanguage: string, private botId: string) {}

  static provideTools(tools: Tools) {
    Engine.tools = tools
  }

  async train(
    intentDefs: NLU.IntentDefinition[],
    entityDefs: NLU.EntityDefinition[],
    languageCode: string,
    trainingSession?: TrainingSession
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

    const input: TrainInput = {
      botId: this.botId,
      trainingSession,
      languageCode,
      list_entities,
      pattern_entities,
      contexts,
      intents: intentDefs
        .filter(x => !!x.utterances[languageCode])
        .map(x => ({
          name: x.name,
          contexts: x.contexts,
          utterances: x.utterances[languageCode],
          slot_definitions: x.slots
        }))
    }

    // Model should be build here, Trainer should not have any idea of how this is stored
    // Error handling should be done here
    const model = await Trainer(input, Engine.tools)
    model.hash = computeModelHash(intentDefs, entityDefs)
    if (model.success) {
      trainingSession &&
        Engine.tools.reportTrainingProgress(this.botId, 'Training complete', {
          ...trainingSession,
          progress: 1,
          status: 'done'
        })

      trainDebug.forBot(this.botId, `Successfully finished ${languageCode} training`)
    }

    return model
  }

  private modelAlreadyLoaded(model: Model) {
    return (
      this.predictorsByLang[model.languageCode] !== undefined &&
      this.modelsByLang[model.languageCode] !== undefined &&
      _.isEqual(this.modelsByLang[model.languageCode].data.input, model.data.input)
      // TODO compare hash instead (need a migration)
      // this.modelsByLang[model.languageCode].hash === model.hash
    )
  }

  async loadModels(models: Model[]) {
    // note the usage of mapSeries, possible race condition
    return Promise.mapSeries(models, model => this.loadModel(model))
  }

  async loadModel(model: Model) {
    if (this.modelAlreadyLoaded(model)) {
      return
    }
    if (!model.data.output) {
      const intents = await ProcessIntents(
        model.data.input.intents,
        model.languageCode,
        model.data.artefacts.list_entities,
        Engine.tools
      )
      model.data.output = { intents } as TrainOutput
    }

    // TODO if model or predictor not valid, throw and retry
    this.predictorsByLang[model.languageCode] = await this._makePredictors(model)
    this.modelsByLang[model.languageCode] = model
  }

  private async _makePredictors(model: Model): Promise<Predictors> {
    const { input, output, artefacts } = model.data
    const tools = Engine.tools

    if (_.flatMap(input.intents, i => i.utterances).length <= 0) {
      // we don't want to return undefined as extraction won't be triggered
      // we want to make it possible to extract entities without having any intents
      return { ...artefacts, intents: [], pattern_entities: input.pattern_entities } as Predictors
    }

    const { ctx_model, intent_model_by_ctx, oos_model } = artefacts
    const ctx_classifier = ctx_model ? new tools.mlToolkit.SVM.Predictor(ctx_model) : undefined
    const intent_classifier_per_ctx = _.toPairs(intent_model_by_ctx).reduce(
      (c, [ctx, intentModel]) => ({ ...c, [ctx]: new tools.mlToolkit.SVM.Predictor(intentModel as string) }),
      {} as _.Dictionary<MLToolkit.SVM.Predictor>
    )
    const oos_classifier = isPOSAvailable(model.languageCode) ? new tools.mlToolkit.SVM.Predictor(oos_model) : undefined
    const slot_tagger = new SlotTagger(tools.mlToolkit)
    slot_tagger.load(artefacts.slots_model)

    const kmeans = computeKmeans(output.intents, tools) // TODO load from artefacts when persisted

    return {
      ...artefacts,
      ctx_classifier,
      oos_classifier,
      intent_classifier_per_ctx,
      slot_tagger,
      kmeans,
      pattern_entities: input.pattern_entities,
      intents: output.intents
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
}
