import { MLToolkit } from 'botpress/sdk'
import _ from 'lodash'
import {
  EntityPrediction,
  SlotPrediction,
  ContextPrediction,
  IntentPrediction as StanIntentPrediction
} from 'nlu/typings_v1'
import { PredictOutput } from '../typings'

import { extractListEntities, extractPatternEntities } from './entities/custom-entity-extractor'
import { IntentPrediction, IntentPredictions, NoneableIntentPredictions } from './intents/intent-classifier'
import { OOSIntentClassifier } from './intents/oos-intent-classfier'
import { SvmIntentClassifier } from './intents/svm-intent-classifier'
import makeSpellChecker from './language/spell-checker'
import SlotTagger from './slots/slot-tagger'
import {
  EntityExtractionResult,
  ExtractedEntity,
  Intent,
  ListEntityModel,
  PatternEntity,
  SlotExtractionResult,
  TFIDF,
  Tools
} from './typings'
import Utterance, { buildUtteranceBatch, preprocessRawUtterance, UtteranceEntity } from './utterance/utterance'

export interface Predictors {
  lang: string
  tfidf: TFIDF
  vocab: string[]
  contexts: string[]
  list_entities: ListEntityModel[] // no need for cache
  pattern_entities: PatternEntity[]
  intents: Intent<string>[]
  ctx_classifier: SvmIntentClassifier
  intent_classifier_per_ctx: _.Dictionary<OOSIntentClassifier>
  slot_tagger_per_intent: _.Dictionary<SlotTagger>
  kmeans?: MLToolkit.KMeans.KmeansResult
}

export interface PredictInput {
  language: string
  text: string
}

interface InitialStep {
  rawText: string
  languageCode: string
}
type PredictStep = InitialStep & { utterance: Utterance }
type ContextStep = PredictStep & { ctx_predictions: IntentPredictions }
type IntentStep = ContextStep & { intent_predictions: _.Dictionary<NoneableIntentPredictions> }
type SlotStep = IntentStep & { slot_predictions_per_intent: _.Dictionary<SlotExtractionResult[]> }
type SpellStep = SlotStep & { spellChecked: string }

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

async function makePredictionUtterance(input: InitialStep, predictors: Predictors, tools: Tools): Promise<PredictStep> {
  const { tfidf, vocab, kmeans } = predictors

  const text = preprocessRawUtterance(input.rawText.trim())

  const [utterance] = await buildUtteranceBatch(_.uniq([text]), input.languageCode, tools, vocab)

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
      ...(await tools.systemEntityExtractor.extract(utterance.toString(), utterance.languageCode))
    ],
    entityRes => {
      utterance.tagEntity(_.omit(entityRes, ['start, end']) as ExtractedEntity, entityRes.start, entityRes.end)
    }
  )

  return { ...input }
}

export async function predictContext(input: PredictStep, predictors: Predictors): Promise<ContextStep> {
  const { ctx_classifier } = predictors
  const ctx_predictions = await ctx_classifier.predict(input.utterance)
  return {
    ...input,
    ctx_predictions
  }
}

export async function predictIntent(input: ContextStep, predictors: Predictors): Promise<IntentStep> {
  if (_.flatMap(predictors.intents, i => i.utterances).length <= 0) {
    const nonePrediction = <NoneableIntentPredictions>{
      oos: 1,
      intents: [{ name: NONE_INTENT, confidence: 1 }]
    }
    const allCtxs = predictors.contexts
    const intent_predictions = _.zipObject(
      allCtxs,
      allCtxs.map(_ => ({ ...nonePrediction }))
    )
    return { ...input, intent_predictions }
  }

  const ctxToPredict = input.ctx_predictions.intents.map(p => p.name)
  const predictions = (
    await Promise.map(ctxToPredict, async ctx => predictors.intent_classifier_per_ctx[ctx].predict(input.utterance))
  ).filter(_.identity)

  return {
    ...input,
    intent_predictions: _.zipObject(ctxToPredict, predictions)
  }
}

async function extractSlots(input: IntentStep, predictors: Predictors): Promise<SlotStep> {
  const slots_per_intent: _.Dictionary<SlotExtractionResult[]> = {}

  for (const intent of predictors.intents.filter(x => x.slot_definitions.length > 0)) {
    const slotTagger = predictors.slot_tagger_per_intent[intent.name]
    const slots = await slotTagger.predict(input.utterance)
    slots_per_intent[intent.name] = slots
  }

  return { ...input, slot_predictions_per_intent: slots_per_intent }
}

async function spellCheck(input: SlotStep, predictors: Predictors, tools: Tools): Promise<SpellStep> {
  const spellChecker = makeSpellChecker(predictors.vocab, input.languageCode, tools)
  const spellChecked = await spellChecker(input.utterance.toString({ entities: 'keep-value', slots: 'keep-value' }))
  return {
    ...input,
    spellChecked
  }
}

function MapStepToOutput(step: SpellStep): PredictOutput {
  const entitiesMapper = (e?: EntityExtractionResult | UtteranceEntity): EntityPrediction | null => {
    if (!e) {
      return null
    }

    return {
      name: e.type,
      type: e.metadata.entityId,
      unit: e.metadata.unit ?? '',
      value: e.value,
      sensitive: !!e.sensitive,
      confidence: e.confidence,
      end: (e as EntityExtractionResult).end ?? (e as UtteranceEntity).endPos,
      source: e.metadata.source,
      start: (e as EntityExtractionResult).start ?? (e as UtteranceEntity).startPos
    }
  }

  const entities = step.utterance.entities
    .map(entitiesMapper)
    .filter(<(e: EntityPrediction | null) => e is EntityPrediction>(e => !!e))

  const slotsCollectionReducer = (slots: Dic<SlotPrediction>, s: SlotExtractionResult): Dic<SlotPrediction> => {
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

  const intentMapper = (intentPred: IntentPrediction): StanIntentPrediction => {
    const { name, confidence, extractor } = intentPred

    const slotCollection = (step.slot_predictions_per_intent?.[name] || []).reduce(slotsCollectionReducer, {})

    const stanIntentPred: StanIntentPrediction = {
      extractor,
      name,
      confidence,
      slots: Object.values(slotCollection)
    }
    return stanIntentPred
  }

  const contexts: ContextPrediction[] = step.ctx_predictions.intents.reduce((preds, current) => {
    const { name: ctxName, confidence } = current

    const intentPred = step.intent_predictions[ctxName]
    const intents = !intentPred ? [] : intentPred.intents.map(intentMapper)

    const ctxPred: ContextPrediction = {
      name: ctxName,
      confidence,
      oos: intentPred?.oos || 0,
      intents
    }

    return [...preds, ctxPred]
  }, <ContextPrediction[]>[])

  return {
    entities,
    contexts: _.orderBy(contexts, x => x.confidence, 'desc'),
    spellChecked: step.spellChecked
  }
}

export const Predict = async (input: PredictInput, tools: Tools, predictors: Predictors): Promise<PredictOutput> => {
  const { step } = await preprocessInput(input, tools, predictors)
  const initialStep = await makePredictionUtterance(step, predictors, tools)
  const entitesStep = await extractEntities(initialStep, predictors, tools)
  const ctxStep = await predictContext(entitesStep, predictors)
  const intentStep = await predictIntent(ctxStep, predictors)
  const slotStep = await extractSlots(intentStep, predictors)
  const spellStep = await spellCheck(slotStep, predictors, tools)
  const output = MapStepToOutput(spellStep)
  return output
}
