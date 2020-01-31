import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import LanguageIdentifierProvider, { NA_LANG } from '../pipelines/language/ft_lid'
import * as math from '../tools/math'
import { replaceConsecutiveSpaces } from '../tools/strings'
import { Intent, PatternEntity, Tools } from '../typings'

import CRFExtractor2 from './crf-extractor2'
import { extractListEntities, extractPatternEntities, mapE1toE2Entity } from './entity-extractor'
import { EXACT_MATCH_STR_OPTIONS, ExactMatchIndex, TrainArtefacts } from './training-pipeline'
import Utterance, { buildUtteranceBatch, getAlternateUtterance } from './utterance'
import { POS_CLASSES } from '../pos-tagger'
import { encodeOH } from '../tools/encoder'

export type Predictors = TrainArtefacts & {
  ctx_classifier: sdk.MLToolkit.SVM.Predictor
  intent_classifier_per_ctx: _.Dictionary<sdk.MLToolkit.SVM.Predictor>
  kmeans: sdk.MLToolkit.KMeans.KmeansResult
  slot_tagger: CRFExtractor2 // TODO replace this by MlToolkit.CRF.Tagger
  pattern_entities: PatternEntity[]
  intents: Intent<Utterance>[]
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
  // TODO slots predictions per intent
}

export type PredictOutput = sdk.IO.EventUnderstanding // temporary fully compliant with engine1

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
  supportedLanguages: string[],
  tools: Tools
): Promise<{ detectedLanguage: string; usedLanguage: string }> {
  const langIdentifier = LanguageIdentifierProvider.getLanguageIdentifier(tools.mlToolkit)
  const lidRes = await langIdentifier.identify(input.sentence)
  const elected = lidRes.filter(pred => supportedLanguages.includes(pred.label))[0]

  // because with single-worded sentences, confidence is always very low
  // we assume that a input of 20 chars is more than a single word
  const threshold = input.sentence.length > 20 ? 0.5 : 0.3

  let detectedLanguage = _.get(elected, 'label', NA_LANG)
  if (detectedLanguage !== NA_LANG && !supportedLanguages.includes(detectedLanguage)) {
    detectedLanguage = NA_LANG
  }

  const usedLanguage =
    detectedLanguage !== NA_LANG && elected.value > threshold ? detectedLanguage : input.defaultLanguage

  return { usedLanguage, detectedLanguage }
}
async function preprocessInput(
  input: PredictInput,
  tools: Tools,
  predictorsBylang: _.Dictionary<Predictors>
): Promise<{ stepOutput: PredictStep; predictors: Predictors }> {
  const { detectedLanguage, usedLanguage } = await DetectLanguage(input, Object.keys(predictorsBylang), tools)
  const predictors = predictorsBylang[usedLanguage]
  if (_.isEmpty(predictors)) {
    // eventually better validation than empty check
    throw new InvalidLanguagePredictorError(usedLanguage)
  }

  const stepOutput: PredictStep = {
    includedContexts: input.includedContexts,
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
  const { utterance } = input
  const sysEntities = (await tools.duckling.extract(utterance.toString(), utterance.languageCode)).map(mapE1toE2Entity)

  _.forEach(
    [
      ...extractListEntities(input.utterance, predictors.list_entities),
      ...extractPatternEntities(utterance, predictors.pattern_entities),
      ...sysEntities
    ],
    entityRes => {
      input.utterance.tagEntity(_.omit(entityRes, ['start, end']), entityRes.start, entityRes.end)
    }
  )

  return { ...input }
}

async function predictContext(input: PredictStep, predictors: Predictors): Promise<PredictStep> {
  const classifier = predictors.ctx_classifier
  if (!classifier) {
    return { ...input, ctx_predictions: [{ label: DEFAULT_CTX, confidence: 1 }] }
  }

  const features = input.utterance.sentenceEmbedding
  const predictions = await classifier.predict(features)

  return {
    ...input,
    ctx_predictions: predictions
  }
}

async function predictIntent(input: PredictStep, predictors: Predictors): Promise<PredictStep> {
  if (predictors.intents.length === 0) {
    return { ...input, intent_predictions: { per_ctx: { [DEFAULT_CTX]: [{ label: NONE_INTENT, confidence: 1 }] } } }
  }

  const ctxToPredict = input.ctx_predictions.map(p => p.label)
  const predictions = (
    await Promise.map(ctxToPredict, async ctx => {
      const predictor = predictors.intent_classifier_per_ctx[ctx]
      if (!predictor) {
        return
      }
      const features = [...input.utterance.sentenceEmbedding, input.utterance.tokens.length]
      let preds = await predictor.predict(features)
      const exactPred = findExactIntentForCtx(predictors.exact_match_index, input.utterance, ctx)
      if (exactPred) {
        preds.unshift(exactPred)
      }

      if (input.alternateUtterance) {
        // Do we want exact preds as well ?
        const alternateFeats = [...input.alternateUtterance.sentenceEmbedding, input.alternateUtterance.tokens.length]
        const alternatePreds = await predictor.predict(alternateFeats)
        // we might want to do this in intent election intead

        // mean
        preds = _.chain([...alternatePreds, ...preds])
          .groupBy('label')
          .mapValues(gr => _.meanBy(gr, 'confidence'))
          .toPairs()
          .map(([label, confidence]) => ({ label, confidence }))
          .value()
      }

      return preds
    })
  ).filter(_.identity)

  return {
    ...input,
    intent_predictions: { per_ctx: _.zipObject(ctxToPredict, predictions) }
  }
}

// taken from svm classifier #295
// this means that the 3 best predictions are really close, do not change magic numbers
function predictionsReallyConfused(predictions: sdk.MLToolkit.SVM.Prediction[]): boolean {
  if (predictions.length <= 2) {
    return false
  }

  const std = math.std(predictions.map(p => p.confidence))
  const diff = (predictions[0].confidence - predictions[1].confidence) / std
  if (diff >= 2.5) {
    return false
  }

  const bestOf3STD = math.std(predictions.slice(0, 3).map(p => p.confidence))
  return bestOf3STD <= 0.03
}

// TODO implement this algorithm properly / improve it
// currently taken as is from svm classifier (engine 1) and doesn't make much sens
function electIntent(input: PredictStep): PredictStep {
  const totalConfidence = Math.min(
    1,
    _.sumBy(
      input.ctx_predictions.filter(x => input.includedContexts.includes(x.label)),
      'confidence'
    )
  )
  const ctxPreds = input.ctx_predictions.map(x => ({ ...x, confidence: x.confidence / totalConfidence }))

  // taken from svm classifier #349
  let predictions = _.chain(ctxPreds)
    .flatMap(({ label: ctx, confidence: ctxConf }) => {
      const intentPreds = _.orderBy(input.intent_predictions.per_ctx[ctx], 'confidence', 'desc')
      if (intentPreds.length === 1 || intentPreds[0].confidence === 1) {
        return [{ label: intentPreds[0].label, l0Confidence: ctxConf, context: ctx, confidence: 1 }]
      }

      if (predictionsReallyConfused(intentPreds)) {
        const others = _.take(intentPreds, 4).map(x => ({
          label: x.label,
          l0Confidence: ctxConf,
          confidence: ctxConf * x.confidence,
          context: ctx
        }))
        return [{ label: 'none', l0Confidence: ctxConf, context: ctx, confidence: 1 }, ...others] // refine confidence
      }

      const lnstd = math.std(intentPreds.map(x => Math.log(x.confidence))) // because we want a lognormal distribution
      let p1Conf = math.GetZPercent((Math.log(intentPreds[0].confidence) - Math.log(intentPreds[1].confidence)) / lnstd)
      if (isNaN(p1Conf)) {
        p1Conf = 0.5
      }

      return [
        { label: intentPreds[0].label, l0Confidence: ctxConf, context: ctx, confidence: ctxConf * p1Conf },
        { label: intentPreds[1].label, l0Confidence: ctxConf, context: ctx, confidence: ctxConf * (1 - p1Conf) }
      ]
    })
    .orderBy('confidence', 'desc')
    .uniqBy(p => p.label)
    .filter(p => input.includedContexts.includes(p.context))
    .map(p => ({ name: p.label, context: p.context, confidence: p.confidence }))
    .value()

  // @ts-ignore
  // if (!predictions.length || predictions[0].confidence < 0.3 || input.outOfScope) {
  if (!predictions.length || predictions[0].confidence < 0.3) {
    predictions = [
      { name: NONE_INTENT, context: _.get(predictions, '0.context', 'global'), confidence: 1 },
      ...predictions.filter(p => p.name !== NONE_INTENT)
    ]
  }

  return _.merge(input, {
    intent_predictions: { combined: predictions, elected: _.maxBy(predictions, 'confidence') }
  })
}

async function predictOutOfScope(input: PredictStep, predictors: Predictors, tools: Tools): Promise<PredictStep> {
  // @ts-ignore
  const oos = new tools.mlToolkit.SVM.Predictor(predictors.oos_model)
  // @ts-ignore
  // const pred1 = (await oos.predict(input.utterance.sentenceEmbedding))[0].label
  // // @ts-ignore
  // const pred2 = input.alternateUtterance ? (await oos.predict(input.alternateUtterance.sentenceEmbedding))[0].label : -1
  const utt = input.alternateUtterance || input.utterance
  const posOH = encodeOH(
    POS_CLASSES,
    utt.tokens.map(t => t.POS)
  )

  // const kmeansOH = encodeOH(
  //   _.range(8),
  //   utt.tokens.map(t => t.cluster)
  // )

  // const features = [...posOH, ...kmeansOH, utt.tokens.length]
  const features = [...utt.sentenceEmbedding, ...posOH]
  // const features = posOH
  // @ts-ignore
  const outOfScope = (await oos.predict(features))[0].label === -1

  return {
    ...input,
    // @ts-ignore
    outOfScope
  }
}

function detectAmbiguity(input: PredictStep): PredictStep {
  // +- 10% away from perfect median leads to ambiguity
  const preds = input.intent_predictions.combined
  const perfectConfusion = 1 / preds.length
  const low = perfectConfusion - 0.1
  const up = perfectConfusion + 0.1
  const confidenceVec = preds.map(p => p.confidence)

  const ambiguous = preds.length > 1 && math.allInRange(confidenceVec, low, up)

  return _.merge(input, { intent_predictions: { ambiguous } })
}

async function extractSlots(input: PredictStep, predictors: Predictors): Promise<PredictStep> {
  const intent =
    !input.intent_predictions.ambiguous &&
    predictors.intents.find(i => i.name === input.intent_predictions.elected.name)
  if (intent && intent.slot_definitions.length > 0) {
    // TODO try to extract for each intent predictions and then rank this in the election step
    const slots = await predictors.slot_tagger.extract(input.utterance, intent)
    slots.forEach(({ slot, start, end }) => {
      input.utterance.tagSlot(slot, start, end)
    })
  }

  return { ...input }
}

function MapStepToOutput(step: PredictStep, startTime: number): PredictOutput {
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
          confidence: e.confidence,
          end: e.endPos,
          source: e.metadata.source,
          start: e.startPos
        }
      } as sdk.NLU.Entity)
  )

  const slots = step.utterance.slots.reduce((slots, s) => {
    return {
      ...slots,
      [s.name]: {
        start: s.startPos,
        end: s.endPos,
        confidence: s.confidence,
        name: s.name,
        source: s.source,
        value: s.value
      } as sdk.NLU.Slot
    }
  }, {} as sdk.NLU.SlotCollection)
  return {
    ambiguous: step.intent_predictions.ambiguous,
    detectedLanguage: step.detectedLanguage,
    entities,
    errored: false,
    includedContexts: step.includedContexts,
    intent: step.intent_predictions.elected,
    intents: step.intent_predictions.combined,
    language: step.languageCode,
    // @ts-ignore
    outOfScope: step.outOfScope,
    slots,
    ms: Date.now() - startTime
  }
}

// TODO move this in exact match module
export function findExactIntentForCtx(
  exactMatchIndex: ExactMatchIndex,
  utterance: Utterance,
  ctx: string
): sdk.MLToolkit.SVM.Prediction | undefined {
  // TODO add some levinstein logic here
  const candidateKey = utterance.toString(EXACT_MATCH_STR_OPTIONS)

  const maybeMatch = exactMatchIndex[candidateKey]
  if (_.get(maybeMatch, 'contexts', []).includes(ctx)) {
    return { label: maybeMatch.intent, confidence: 1 }
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
    stepOutput = await predictOutOfScope(stepOutput, predictors, tools)
    stepOutput = await predictContext(stepOutput, predictors)
    stepOutput = await predictIntent(stepOutput, predictors)
    stepOutput = electIntent(stepOutput)
    stepOutput = detectAmbiguity(stepOutput)
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
