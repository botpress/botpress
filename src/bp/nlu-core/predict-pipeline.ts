import * as sdk from 'botpress/sdk'
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

export type ExactMatchResult = (sdk.MLToolkit.SVM.Prediction & { extractor: 'exact-matcher' }) | undefined

export type Predictors = {
  lang: string
  list_entities: ListEntityModel[] // no need for cache
  tfidf: TFIDF
  vocabVectors: Token2Vec
  contexts: string[]
  exact_match_index: ExactMatchIndex
  pattern_entities: PatternEntity[]
  intents: Intent<Utterance>[]
} & Partial<{
  ctx_classifier: sdk.MLToolkit.SVM.Predictor
  intent_classifier_per_ctx: _.Dictionary<sdk.MLToolkit.SVM.Predictor>
  oos_classifier_per_ctx: _.Dictionary<sdk.MLToolkit.SVM.Predictor>
  kmeans: sdk.MLToolkit.KMeans.KmeansResult
  slot_tagger: SlotTagger // TODO replace this by MlToolkit.CRF.Tagger
}>

export interface PredictInput {
  language: string
  includedContexts: string[]
  sentence: string
}

interface InitialStep {
  readonly rawText: string
  includedContexts: string[]
  languageCode: string
}
type PredictStep = InitialStep & { utterance: Utterance }
type OutOfScopeStep = PredictStep & { oos_predictions: _.Dictionary<number> }
type ContextStep = OutOfScopeStep & { ctx_predictions: sdk.MLToolkit.SVM.Prediction[] }
type IntentStep = ContextStep & { intent_predictions: _.Dictionary<sdk.MLToolkit.SVM.Prediction[]> }
type SlotStep = IntentStep & { slot_predictions_per_intent: _.Dictionary<SlotExtractionResult[]> }

export type PredictOutput = sdk.IO.EventUnderstanding

const DEFAULT_CTX = 'global'
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

  const contexts = input.includedContexts.filter(x => predictors.contexts.includes(x))
  const step: InitialStep = {
    includedContexts: _.isEmpty(contexts) ? predictors.contexts : contexts,
    rawText: input.sentence,
    languageCode: usedLanguage
  }

  return { step }
}

async function makePredictionUtterance(input: InitialStep, predictors: Predictors, tools: Tools): Promise<PredictStep> {
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

async function extractEntities(input: PredictStep, predictors: Predictors, tools: Tools): Promise<PredictStep> {
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

async function predictContext(input: OutOfScopeStep, predictors: Predictors): Promise<ContextStep> {
  const customEntities = getCustomEntitiesNames(predictors)

  const classifier = predictors.ctx_classifier
  if (!classifier) {
    return {
      ...input,
      ctx_predictions: [
        {
          label: input.includedContexts.length ? input.includedContexts[0] : DEFAULT_CTX,
          confidence: 1
        }
      ]
    }
  }

  const features = getCtxFeatures(input.utterance, customEntities)
  const ctx_predictions = await classifier.predict(features)

  return {
    ...input,
    ctx_predictions
  }
}

async function predictIntent(input: ContextStep, predictors: Predictors): Promise<IntentStep> {
  if (_.flatMap(predictors.intents, i => i.utterances).length <= 0) {
    return { ...input, intent_predictions: { [DEFAULT_CTX]: [{ label: NONE_INTENT, confidence: 1 }] } }
  }

  const customEntities = getCustomEntitiesNames(predictors)

  const ctxToPredict = input.ctx_predictions.map(p => p.label)
  const predictions = (
    await Promise.map(ctxToPredict, async ctx => {
      const preds: sdk.MLToolkit.SVM.Prediction[] = []

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

async function predictOutOfScope(input: PredictStep, predictors: Predictors): Promise<OutOfScopeStep> {
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

function MapStepToOutput(step: SlotStep, startTime: number): PredictOutput {
  const entitiesMapper = (e?: EntityExtractionResult | UtteranceEntity): sdk.NLU.Entity => {
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

  // legacy pre-ndu
  const slots = step.utterance.slots.reduce((slots, s) => {
    return {
      ...slots,
      [s.name]: {
        start: s.startPos,
        end: s.endPos,
        confidence: s.confidence,
        name: s.name,
        source: s.source,
        value: s.value,
        entity: entitiesMapper(s.entity) // TODO: add this mapper to the legacy election pipeline
      }
    }
  }, {} as sdk.NLU.SlotCollection)

  const slotsCollectionReducer = (slots: sdk.NLU.SlotCollection, s: SlotExtractionResult): sdk.NLU.SlotCollection => {
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

  const predictions: sdk.NLU.Predictions = step.ctx_predictions!.reduce((preds, current) => {
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

  return {
    entities,
    errored: false,
    predictions: _.chain(predictions) // orders all predictions by confidence
      .entries()
      .orderBy(x => x[1].confidence, 'desc')
      .fromPairs()
      .value(),
    includedContexts: step.includedContexts, // legacy pre-ndu
    language: step.languageCode,
    ms: Date.now() - startTime
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

export const Predict = async (input: PredictInput, tools: Tools, predictors: Predictors): Promise<PredictOutput> => {
  try {
    const { includedContexts, language, sentence } = input

    const t0 = Date.now()

    // tslint:disable-next-line
    let { step } = await preprocessInput({ includedContexts, language, sentence: sentence }, tools, predictors)

    const initialStep = await makePredictionUtterance(step, predictors, tools)
    const entitesStep = await extractEntities(initialStep, predictors, tools)
    const oosStep = await predictOutOfScope(entitesStep, predictors)
    const ctxStep = await predictContext(oosStep, predictors)
    const intentStep = await predictIntent(ctxStep, predictors)
    const slotStep = await extractSlots(intentStep, predictors)
    const output = MapStepToOutput(slotStep, t0)
    return output
  } catch (err) {
    // tslint:disable-next-line: no-console
    console.log('Could not perform predict data', err)
    return { errored: true } as sdk.IO.EventUnderstanding
  }
}
