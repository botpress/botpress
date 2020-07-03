import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { extractListEntities, extractPatternEntities } from './entities/custom-entity-extractor'
import { getCtxFeatures } from './intents/context-featurizer'
import { getIntentFeatures } from './intents/intent-featurizer'
import LanguageIdentifierProvider, { NA_LANG } from './language/language-identifier'
import { isPOSAvailable } from './language/pos-tagger'
import { getUtteranceFeatures } from './out-of-scope-featurizer'
import SlotTagger from './slots/slot-tagger'
import { replaceConsecutiveSpaces } from './tools/strings'
import { EXACT_MATCH_STR_OPTIONS, ExactMatchIndex, TrainArtefacts } from './training-pipeline'
import { EntityExtractionResult, Intent, PatternEntity, SlotExtractionResult, Tools } from './typings'
import Utterance, { buildUtteranceBatch, getAlternateUtterance, UtteranceEntity } from './utterance/utterance'

export type ExactMatchResult = (sdk.MLToolkit.SVM.Prediction & { extractor: 'exact-matcher' }) | undefined

export type Predictors = TrainArtefacts & {
  ctx_classifier: sdk.MLToolkit.SVM.Predictor
  intent_classifier_per_ctx: _.Dictionary<sdk.MLToolkit.SVM.Predictor>
  oos_classifier_per_ctx: _.Dictionary<sdk.MLToolkit.SVM.Predictor>
  kmeans: sdk.MLToolkit.KMeans.KmeansResult
  slot_tagger: SlotTagger // TODO replace this by MlToolkit.CRF.Tagger
  pattern_entities: PatternEntity[]
  intents: Intent<Utterance>[]
  contexts: string[]
}

export interface PredictInput {
  defaultLanguage: string
  includedContexts: string[]
  sentence: string
}

export type PredictStep = {
  readonly rawText: string
  includedContexts: string[]
  detectedLanguage: string
  languageCode: string
  utterance?: Utterance
  alternateUtterance?: Utterance
  ctx_predictions?: sdk.MLToolkit.SVM.Prediction[]
  intent_predictions?: {
    per_ctx?: _.Dictionary<sdk.MLToolkit.SVM.Prediction[]>
    combined?: E1IntentPred[] // only to comply with E1
    elected?: E1IntentPred // only to comply with E1
    ambiguous?: boolean
  }
  oos_predictions?: _.Dictionary<number>
  slot_predictions_per_intent?: _.Dictionary<SlotExtractionResult[]>
}

export type PredictOutput = sdk.IO.EventUnderstanding

// only to comply with E1
type E1IntentPred = {
  name: string
  context: string
  confidence: number
}

const DEFAULT_CTX = 'global'
const NONE_INTENT = 'none'

async function DetectLanguage(
  input: PredictInput,
  predictorsByLang: _.Dictionary<Predictors>,
  tools: Tools
): Promise<{ detectedLanguage: string; usedLanguage: string }> {
  const supportedLanguages = Object.keys(predictorsByLang)

  const langIdentifier = LanguageIdentifierProvider.getLanguageIdentifier(tools.mlToolkit)
  const lidRes = await langIdentifier.identify(input.sentence)
  const elected = lidRes.filter(pred => supportedLanguages.includes(pred.label))[0]
  let score = elected?.value ?? 0

  // because with single-worded sentences, confidence is always very low
  // we assume that a input of 20 chars is more than a single word
  const threshold = input.sentence.length > 20 ? 0.5 : 0.3

  let detectedLanguage = _.get(elected, 'label', NA_LANG)
  if (detectedLanguage !== NA_LANG && !supportedLanguages.includes(detectedLanguage)) {
    detectedLanguage = NA_LANG
  }

  // if ML-based language identifier didn't find a match
  // we proceed with a custom vocabulary matching algorithm
  // ie. the % of the sentence comprised of tokens in the training vocabulary
  if (detectedLanguage === NA_LANG) {
    try {
      const match = _.chain(supportedLanguages)
        .map(lang => ({
          lang,
          sentence: input.sentence.toLowerCase(),
          tokens: _.orderBy(Object.keys(predictorsByLang[lang].vocabVectors), 'length', 'desc')
        }))
        .map(({ lang, sentence, tokens }) => {
          for (const token of tokens) {
            sentence = sentence.replace(token, '')
          }
          return { lang, confidence: 1 - sentence.length / input.sentence.length }
        })
        .filter(x => x.confidence >= threshold)
        .orderBy('confidence', 'desc')
        .first()
        .value()

      if (match) {
        detectedLanguage = match.lang
        score = match.confidence
      }
    } finally {
    }
  }

  const usedLanguage = detectedLanguage !== NA_LANG && score > threshold ? detectedLanguage : input.defaultLanguage

  return { usedLanguage, detectedLanguage }
}
async function preprocessInput(
  input: PredictInput,
  tools: Tools,
  predictorsBylang: _.Dictionary<Predictors>
): Promise<{ stepOutput: PredictStep; predictors: Predictors }> {
  const { detectedLanguage, usedLanguage } = await DetectLanguage(input, predictorsBylang, tools)
  const predictors = predictorsBylang[usedLanguage]
  if (_.isEmpty(predictors)) {
    // eventually better validation than empty check
    throw new InvalidLanguagePredictorError(usedLanguage)
  }

  const contexts = input.includedContexts.filter(x => predictors.contexts.includes(x))
  const stepOutput: PredictStep = {
    includedContexts: _.isEmpty(contexts) ? predictors.contexts : contexts,
    rawText: input.sentence,
    detectedLanguage,
    languageCode: usedLanguage
  }

  return { stepOutput, predictors }
}

async function makePredictionUtterance(input: PredictStep, predictors: Predictors, tools: Tools): Promise<PredictStep> {
  const { tfidf, vocabVectors, kmeans } = predictors

  const text = replaceConsecutiveSpaces(input.rawText.trim())
  const [utterance] = await buildUtteranceBatch([text], input.languageCode, tools, vocabVectors)
  const alternateUtterance = getAlternateUtterance(utterance, vocabVectors)

  Array(utterance, alternateUtterance)
    .filter(Boolean)
    .forEach(u => {
      u.setGlobalTfidf(tfidf)
      u.setKmeans(kmeans)
    })

  return {
    ...input,
    utterance,
    alternateUtterance
  }
}

async function extractEntities(input: PredictStep, predictors: Predictors, tools: Tools): Promise<PredictStep> {
  const { utterance, alternateUtterance } = input

  _.forEach(
    [
      ...extractListEntities(input.utterance, predictors.list_entities, true),
      ...extractPatternEntities(utterance, predictors.pattern_entities),
      ...(await tools.duckling.extract(utterance.toString(), utterance.languageCode))
    ],
    entityRes => {
      input.utterance.tagEntity(_.omit(entityRes, ['start, end']), entityRes.start, entityRes.end)
    }
  )

  if (alternateUtterance) {
    _.forEach(
      [
        ...extractListEntities(alternateUtterance, predictors.list_entities),
        ...extractPatternEntities(alternateUtterance, predictors.pattern_entities),
        ...(await tools.duckling.extract(alternateUtterance.toString(), utterance.languageCode))
      ],
      entityRes => {
        input.alternateUtterance.tagEntity(_.omit(entityRes, ['start, end']), entityRes.start, entityRes.end)
      }
    )
  }

  return { ...input }
}

const getCustomEntitiesNames = (predictors: Predictors): string[] => [
  ...predictors.list_entities.map(e => e.entityName),
  ...predictors.pattern_entities.map(e => e.name)
]

async function predictContext(input: PredictStep, predictors: Predictors): Promise<PredictStep> {
  const customEntities = getCustomEntitiesNames(predictors)

  const classifier = predictors.ctx_classifier
  if (!classifier) {
    return {
      ...input,
      ctx_predictions: [
        { label: input.includedContexts.length ? input.includedContexts[0] : DEFAULT_CTX, confidence: 1 }
      ]
    }
  }

  const features = getCtxFeatures(input.utterance, customEntities)
  let ctx_predictions = await classifier.predict(features)

  if (input.alternateUtterance) {
    const alternateFeats = getCtxFeatures(input.alternateUtterance, customEntities)
    const alternatePreds = await classifier.predict(alternateFeats)

    // we might want to do this in intent election intead or in NDU
    if ((alternatePreds && alternatePreds[0]?.confidence) ?? 0 > ctx_predictions[0].confidence) {
      // mean
      ctx_predictions = _.chain([...alternatePreds, ...ctx_predictions])
        .groupBy('label')
        .mapValues(gr => _.meanBy(gr, 'confidence'))
        .toPairs()
        .map(([label, confidence]) => ({ label, confidence }))
        .value()
    }
  }

  return {
    ...input,
    ctx_predictions
  }
}

async function predictIntent(input: PredictStep, predictors: Predictors): Promise<PredictStep> {
  if (predictors.intents.length === 0) {
    return { ...input, intent_predictions: { per_ctx: { [DEFAULT_CTX]: [{ label: NONE_INTENT, confidence: 1 }] } } }
  }

  const customEntities = getCustomEntitiesNames(predictors)
  const ctxToPredict = input.ctx_predictions.map(p => p.label)
  const predictions = (
    await Promise.map(ctxToPredict, async ctx => {
      let preds: sdk.MLToolkit.SVM.Prediction[] = []

      const predictor = predictors.intent_classifier_per_ctx[ctx]
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

      if (input.alternateUtterance) {
        const alternateFeats = getIntentFeatures(input.alternateUtterance, customEntities)

        const alternatePreds: sdk.MLToolkit.SVM.Prediction[] = []
        if (predictor) {
          const prediction = await predictor.predict(alternateFeats)
          alternatePreds.push(...prediction)
        }

        const exactPred = findExactIntentForCtx(predictors.exact_match_index, input.alternateUtterance, ctx)
        if (exactPred) {
          const idxToRemove = alternatePreds.findIndex(p => p.label === exactPred.label)
          alternatePreds.splice(idxToRemove, 1)
          alternatePreds.unshift(exactPred)
        }

        if (
          (alternatePreds && alternatePreds.filter(p => p.label !== NONE_INTENT)[0]?.confidence) ??
          0 >= preds.filter(p => p.label !== NONE_INTENT)[0]?.confidence
        ) {
          preds = _.chain([...alternatePreds, ...preds])
            .groupBy('label')
            .map(preds => _.maxBy(preds, 'confidence'))
            .value()
        }
      }

      return preds
    })
  ).filter(_.identity)

  return {
    ...input,
    intent_predictions: { per_ctx: _.zipObject(ctxToPredict, predictions) }
  }
}

async function predictOutOfScope(input: PredictStep, predictors: Predictors): Promise<PredictStep> {
  const oos_predictions = {}
  if (!isPOSAvailable(input.languageCode) || _.isEmpty(predictors.oos_classifier_per_ctx)) {
    return {
      ...input,
      oos_predictions: Object.keys(predictors.contexts).reduce((preds, ctx) => ({ ...preds, [ctx]: 0 }), {})
    }
  }

  const utt = input.alternateUtterance || input.utterance
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

async function extractSlots(input: PredictStep, predictors: Predictors): Promise<PredictStep> {
  const slots_per_intent: typeof input.slot_predictions_per_intent = {}
  for (const intent of predictors.intents.filter(x => x.slot_definitions.length > 0)) {
    const slots = await predictors.slot_tagger.extract(input.utterance, intent)
    slots_per_intent[intent.name] = slots
  }

  return { ...input, slot_predictions_per_intent: slots_per_intent }
}

function MapStepToOutput(step: PredictStep, startTime: number): PredictOutput {
  const entitiesMapper = (e?: EntityExtractionResult | UtteranceEntity): sdk.NLU.Entity => {
    if (!e) {
      return eval('null')
    }

    return {
      name: e.type,
      type: e.metadata.entityId,
      data: {
        unit: e.metadata.unit,
        value: e.value
      },
      meta: {
        sensitive: e.sensitive,
        confidence: e.confidence,
        end: (e as EntityExtractionResult).end ?? (e as UtteranceEntity).endPos,
        source: e.metadata.source,
        start: (e as EntityExtractionResult).start ?? (e as UtteranceEntity).startPos
      }
    }
  }

  // legacy pre-ndu
  const entities = step.utterance.entities.map(
    e =>
      ({
        name: e.type,
        type: e.metadata.entityId,
        data: {
          unit: e.metadata.unit,
          value: e.value
        },
        meta: {
          sensitive: e.sensitive,
          confidence: e.confidence,
          end: e.endPos,
          source: e.metadata.source,
          start: e.startPos
        }
      } as sdk.NLU.Entity)
  )

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

  const predictions: sdk.NLU.Predictions = step.ctx_predictions.reduce((preds, current) => {
    const { label, confidence } = current

    const intentPred = step.intent_predictions.per_ctx[label]
    const intents = !intentPred
      ? []
      : intentPred.map(i => ({
          ...i,
          slots: (step.slot_predictions_per_intent[i.label] || []).reduce(slotsCollectionReducer, {})
        }))

    return {
      ...preds,
      [label]: {
        confidence: confidence,
        oos: step.oos_predictions[label] || 0,
        intents
      }
    }
  }, {})

  return {
    detectedLanguage: step.detectedLanguage,
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
  if (_.get(maybeMatch, 'contexts', []).includes(ctx)) {
    return { label: maybeMatch.intent, confidence: 1, extractor: 'exact-matcher' }
  }
}

export class InvalidLanguagePredictorError extends Error {
  constructor(public languageCode: string) {
    super(`Predictor for language: ${languageCode} is not valid`)
    this.name = 'PredictorError'
  }
}

export const Predict = async (
  input: PredictInput,
  tools: Tools,
  predictorsByLang: _.Dictionary<Predictors>
): Promise<PredictOutput> => {
  try {
    const t0 = Date.now()
    // tslint:disable-next-line
    let { stepOutput, predictors } = await preprocessInput(input, tools, predictorsByLang)

    stepOutput = await makePredictionUtterance(stepOutput, predictors, tools)
    stepOutput = await extractEntities(stepOutput, predictors, tools)
    stepOutput = await predictOutOfScope(stepOutput, predictors)
    stepOutput = await predictContext(stepOutput, predictors)
    stepOutput = await predictIntent(stepOutput, predictors)
    stepOutput = await extractSlots(stepOutput, predictors)

    return MapStepToOutput(stepOutput, t0)
  } catch (err) {
    if (err instanceof InvalidLanguagePredictorError) {
      throw err
    }
    console.log('Could not perform predict data', err)
    return { errored: true } as sdk.IO.EventUnderstanding
  }
}
