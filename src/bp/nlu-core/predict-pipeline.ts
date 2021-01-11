import { MLToolkit, NLU } from 'botpress/sdk'
import _ from 'lodash'

import { extractListEntities, extractPatternEntities } from './entities/custom-entity-extractor'
import { getCtxFeatures } from './intents/context-featurizer'
import { getIntentFeatures } from './intents/intent-featurizer'
import { isPOSAvailable } from './language/pos-tagger'
import { getUtteranceFeatures } from './out-of-scope-featurizer'
import SlotTagger from './slots/slot-tagger'
import { ExactMatchIndex, EXACT_MATCH_STR_OPTIONS } from './training-pipeline'
import {
  EntityExtractionResult,
  ExtractedEntity,
  Intent,
  ListEntityModel,
  PatternEntity,
  SlotExtractionResult,
  TFIDF,
  Token2Vec,
  Tools
} from './typings'
import Utterance, { buildUtteranceBatch, preprocessRawUtterance, UtteranceEntity } from './utterance/utterance'

export type ExactMatchResult = (MLToolkit.SVM.Prediction & { extractor: 'exact-matcher' }) | undefined

export type Predictors = {
  lang: string
  list_entities: ListEntityModel[] // no need for cache
  tfidf: TFIDF
  vocabVectors: Token2Vec
  contexts: string[]
  exact_match_index: ExactMatchIndex
  pattern_entities: PatternEntity[]
  intents: Intent<Utterance>[]
  hook_memory: Object
} & Partial<{
  ctx_classifier: MLToolkit.SVM.Predictor
  intent_classifier_per_ctx: _.Dictionary<MLToolkit.SVM.Predictor>
  oos_classifier_per_ctx: _.Dictionary<MLToolkit.SVM.Predictor>
  kmeans: MLToolkit.KMeans.KmeansResult
  slot_tagger: SlotTagger // TODO replace this by MlToolkit.CRF.Tagger
}>

export interface PredictInput {
  language: string
  text: string
}

interface InitialStep {
  rawText: string
  languageCode: string
}
type PredictStepDS = InitialStep & { utterance: Utterance }
type OutOfScopeStep = PredictStepDS & { oos_predictions: _.Dictionary<number> }
type ContextStep = OutOfScopeStep & { ctx_predictions: MLToolkit.SVM.Prediction[] }
type IntentStep = ContextStep & { intent_predictions: _.Dictionary<MLToolkit.SVM.Prediction[]> }
type SlotStep = IntentStep & { slot_predictions_per_intent: _.Dictionary<SlotExtractionResult[]> }

export interface PredictStep {
  name: string
  eval: (stepDs: PredictStepDS) => Promise<PredictStepDS>
}

export interface PredictHook {
  name: string
  eval: (stepName: string, stepDs: InitialStep, predictors: Predictors) => Promise<void>
}

const NONE_INTENT = 'none'

async function preprocessInput(
  input: PredictInput,
  tools: Tools,
  predictors: Predictors
): Promise<{ step: InitialStep }> {
  const usedLanguage = input.language

  if (_.isEmpty(predictors)) {
    // eventually better validation than empty check
    throw new Error(`Predictor for language: ${usedLanguage} is not valid`)
  }

  const step: InitialStep = {
    rawText: input.text,
    languageCode: usedLanguage
  }

  return { step }
}

async function makePredictionUtterance(
  input: InitialStep,
  predictors: Predictors,
  tools: Tools
): Promise<PredictStepDS> {
  const { tfidf, vocabVectors, kmeans } = predictors

  const text = preprocessRawUtterance(input.rawText.trim())

  const [utterance] = await buildUtteranceBatch(_.uniq([text]), input.languageCode, tools, vocabVectors)

  utterance.setGlobalTfidf(tfidf)
  utterance.setKmeans(kmeans)

  return {
    ...input,
    utterance
  }
}

async function extractEntities(input: PredictStepDS, predictors: Predictors, tools: Tools): Promise<PredictStepDS> {
  const { utterance } = input

  _.forEach(
    [
      ...extractListEntities(utterance, predictors.list_entities),
      ...extractPatternEntities(utterance, predictors.pattern_entities),
      ...(await tools.duckling.extract(utterance.toString(), utterance.languageCode))
    ],
    entityRes => {
      utterance.tagEntity(_.omit(entityRes, ['start, end']) as ExtractedEntity, entityRes.start, entityRes.end)
    }
  )

  return { ...input }
}

const getCustomEntitiesNames = (predictors: Predictors): string[] => [
  ...predictors.list_entities.map(e => e.entityName),
  ...predictors.pattern_entities.map(e => e.name)
]

export async function predictContext(input: OutOfScopeStep, predictors: Predictors): Promise<ContextStep> {
  const classifier = predictors.ctx_classifier
  if (!classifier) {
    const ctxCount = predictors.contexts.length
    if (ctxCount <= 0) {
      return {
        ...input,
        ctx_predictions: []
      }
    }

    const confidence = 1 / ctxCount
    const ctx_predictions = predictors.contexts.map(ctx => ({ label: ctx, confidence }))
    return {
      ...input,
      ctx_predictions
    }
  }

  const customEntities = getCustomEntitiesNames(predictors)
  const features = getCtxFeatures(input.utterance, customEntities)
  const ctx_predictions = await classifier.predict(features)

  return {
    ...input,
    ctx_predictions
  }
}

export async function predictIntent(input: ContextStep, predictors: Predictors): Promise<IntentStep> {
  if (_.flatMap(predictors.intents, i => i.utterances).length <= 0) {
    const noneIntent = { label: NONE_INTENT, confidence: 1 }
    const allCtxs = predictors.contexts
    const intent_predictions = _.zipObject(
      allCtxs,
      allCtxs.map(_ => [{ ...noneIntent }])
    )
    return { ...input, intent_predictions }
  }

  const customEntities = getCustomEntitiesNames(predictors)

  const ctxToPredict = input.ctx_predictions.map(p => p.label)
  const predictions = (
    await Promise.map(ctxToPredict, async ctx => {
      const preds: MLToolkit.SVM.Prediction[] = []

      const predictor = predictors.intent_classifier_per_ctx?.[ctx]
      if (predictor) {
        const features = getIntentFeatures(input.utterance, customEntities)
        const prediction = await predictor.predict(features)
        preds.push(...prediction)
      }
      const exactPred = findExactIntentForCtx(predictors.exact_match_index, input.utterance, ctx)
      if (exactPred) {
        const idxToRemove = preds.findIndex(p => p.label === exactPred.label)
        preds.splice(idxToRemove, 1)
        preds.unshift(exactPred)
      }

      return preds
    })
  ).filter(_.identity)

  return {
    ...input,
    intent_predictions: _.zipObject(ctxToPredict, predictions)
  }
}

async function predictOutOfScope(input: PredictStepDS, predictors: Predictors): Promise<OutOfScopeStep> {
  const oos_predictions = {} as _.Dictionary<number>
  if (
    !isPOSAvailable(input.languageCode) ||
    !predictors.oos_classifier_per_ctx ||
    _.isEmpty(predictors.oos_classifier_per_ctx)
  ) {
    return {
      ...input,
      oos_predictions: predictors.contexts.reduce((preds, ctx) => ({ ...preds, [ctx]: 0 }), {})
    }
  }

  const utt = input.utterance
  const feats = getUtteranceFeatures(utt, predictors.vocabVectors)
  for (const ctx of predictors.contexts) {
    try {
      const preds = await predictors.oos_classifier_per_ctx[ctx].predict(feats)
      oos_predictions[ctx] = _.chain(preds)
        .filter(p => p.label.startsWith('out'))
        .maxBy('confidence')
        .get('confidence', 0)
        .value()
    } catch (err) {
      oos_predictions[ctx] = 0
    }
  }

  return {
    ...input,
    oos_predictions
  }
}

async function extractSlots(input: IntentStep, predictors: Predictors): Promise<SlotStep> {
  if (!predictors.slot_tagger) {
    return { ...input, slot_predictions_per_intent: {} }
  }

  const slots_per_intent: _.Dictionary<SlotExtractionResult[]> = {}
  for (const intent of predictors.intents.filter(x => x.slot_definitions.length > 0)) {
    const slots = await predictors.slot_tagger.extract(input.utterance, intent)
    slots_per_intent[intent.name] = slots
  }

  return { ...input, slot_predictions_per_intent: slots_per_intent }
}

function MapStepToOutput(step: SlotStep): NLU.PredictOutput {
  const entitiesMapper = (e?: EntityExtractionResult | UtteranceEntity): NLU.Entity => {
    if (!e) {
      return eval('null')
    }

    return {
      name: e.type,
      type: e.metadata.entityId,
      data: {
        unit: e.metadata.unit ?? '',
        value: e.value
      },
      meta: {
        sensitive: !!e.sensitive,
        confidence: e.confidence,
        end: (e as EntityExtractionResult).end ?? (e as UtteranceEntity).endPos,
        source: e.metadata.source,
        start: (e as EntityExtractionResult).start ?? (e as UtteranceEntity).startPos
      }
    }
  }

  // legacy pre-ndu
  const entities = step.utterance.entities.map(entitiesMapper)

  const slotsCollectionReducer = (slots: NLU.SlotCollection, s: SlotExtractionResult): NLU.SlotCollection => {
    if (slots[s.slot.name] && slots[s.slot.name].confidence > s.slot.confidence) {
      // we keep only the most confident slots
      return slots
    }

    return {
      ...slots,
      [s.slot.name]: {
        start: s.start,
        end: s.end,
        confidence: s.slot.confidence,
        name: s.slot.name,
        source: s.slot.source,
        value: s.slot.value,
        entity: entitiesMapper(s.slot.entity)
      }
    }
  }

  const predictions: NLU.Predictions = step.ctx_predictions!.reduce((preds, current) => {
    const { label, confidence } = current

    const intentPred = step.intent_predictions[label]
    const intents = !intentPred
      ? []
      : intentPred.map(i => ({
          extractor: 'classifier', // exact-matcher overwrites this field in line below
          ...i,
          slots: (step.slot_predictions_per_intent?.[i.label] || []).reduce(slotsCollectionReducer, {})
        }))

    const includeOOS = !intents.filter(x => x.extractor === 'exact-matcher').length

    return {
      ...preds,
      [label]: {
        confidence,
        oos: includeOOS ? step.oos_predictions[label] || 0 : 0,
        intents
      }
    }
  }, {})

  return <NLU.PredictOutput>{
    entities,
    predictions: _.chain(predictions) // orders all predictions by confidence
      .entries()
      .orderBy(x => x[1].confidence, 'desc')
      .fromPairs()
      .value()
  }
}

export function findExactIntentForCtx(
  exactMatchIndex: ExactMatchIndex,
  utterance: Utterance,
  ctx: string
): ExactMatchResult {
  const candidateKey = utterance.toString(EXACT_MATCH_STR_OPTIONS)

  const maybeMatch = exactMatchIndex[candidateKey]
  const matchedCtx = _.get(maybeMatch, 'contexts', [] as string[])
  if (matchedCtx.includes(ctx)) {
    return { label: maybeMatch.intent, confidence: 1, extractor: 'exact-matcher' }
  }
}

const hookRunner = (hooks: PredictHook[], predictors: Predictors) => {
  hooks = _.sortBy(hooks, h => h.name)
  return async (stepName: string, step: InitialStep) => {
    return Promise.mapSeries(hooks, h => h.eval(stepName, step, predictors))
  }
}

export const Predict = async (
  input: PredictInput,
  tools: Tools,
  predictors: Predictors,
  hooks: PredictHook[]
): Promise<NLU.PredictOutput> => {
  const runHooks = hookRunner(hooks, predictors)
  const { step } = await preprocessInput(input, tools, predictors)
  await runHooks('preprocessInput', step)
  const initialStep = await makePredictionUtterance(step, predictors, tools)
  await runHooks('makePredictionUtterance', step)
  const entitesStep = await extractEntities(initialStep, predictors, tools)
  await runHooks('extractEntities', step)
  const oosStep = await predictOutOfScope(entitesStep, predictors)
  await runHooks('predictOutOfScope', step)
  const ctxStep = await predictContext(oosStep, predictors)
  await runHooks('predictContext', step)
  const intentStep = await predictIntent(ctxStep, predictors)
  await runHooks('predictIntent', step)
  const slotStep = await extractSlots(intentStep, predictors)
  await runHooks('extractSlots', step)
  const output = MapStepToOutput(slotStep)
  return output
}
