import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { Logger } from '../typings'

import { serializeKmeans } from './clustering'
import { extractListEntitiesWithCache, extractPatternEntities } from './entities/custom-entity-extractor'
import { warmEntityCache } from './entities/entity-cache-manager'
import { getCtxFeatures } from './intents/context-featurizer'
import { OOSIntentClassifier } from './intents/oos-intent-classfier'
import { SvmIntentClassifier } from './intents/svm-intent-classifier'
import SlotTagger from './slots/slot-tagger'
import { replaceConsecutiveSpaces } from './tools/strings'
import tfidf from './tools/tfidf'
import { convertToRealSpaces } from './tools/token-utils'
import {
  ColdListEntityModel,
  EntityCacheDump,
  EntityExtractionResult,
  Intent,
  ListEntity,
  PatternEntity,
  SerializedKmeansResult,
  TFIDF,
  Token2Vec,
  Tools as LanguageTools,
  WarmedListEntityModel
} from './typings'
import Utterance, { buildUtteranceBatch, UtteranceToken } from './utterance/utterance'

type ListEntityWithCache = ListEntity & {
  cache: EntityCacheDump
}

export type TrainInput = Readonly<{
  trainId: string
  nluSeed: number
  languageCode: string
  pattern_entities: PatternEntity[]
  list_entities: ListEntityWithCache[]
  contexts: string[]
  intents: Intent<string>[]
  ctxToTrain: string[]
}>

export type TrainStep = Readonly<{
  trainId: string
  nluSeed: number
  languageCode: string
  list_entities: WarmedListEntityModel[]
  pattern_entities: PatternEntity[]
  contexts: string[]
  intents: Intent<Utterance>[]
  vocabVectors: Token2Vec
  tfIdf?: TFIDF
  kmeans?: sdk.MLToolkit.KMeans.KmeansResult
  ctxToTrain: string[]
}>

export interface TrainOutput {
  list_entities: ColdListEntityModel[]
  tfidf: TFIDF
  vocab: string[]
  kmeans: SerializedKmeansResult | undefined
  contexts: string[]
  ctx_model: string
  intent_model_by_ctx: Dic<string>
  slots_model_by_intent: Dic<string>
}

interface Tools extends LanguageTools {
  logger?: Logger
}

type progressCB = (p?: number) => void

const NUM_CLUSTERS = 8
const KMEANS_OPTIONS = {
  iterations: 250,
  initialization: 'random',
  seed: 666 // so training is consistent
} as sdk.MLToolkit.KMeans.KMeansOptions

async function PreprocessInput(input: TrainInput, tools: Tools): Promise<TrainStep> {
  input = _.cloneDeep(input)
  const list_entities = await Promise.map(input.list_entities, list =>
    makeListEntityModel(list, input.languageCode, tools)
  )

  const intents = await ProcessIntents(input.intents, input.languageCode, tools)
  const vocabVectors = buildVectorsVocab(intents)

  const { trainId, nluSeed, languageCode, pattern_entities, contexts, ctxToTrain } = input
  return {
    trainId,
    nluSeed,
    languageCode,
    pattern_entities,
    contexts,
    ctxToTrain,
    list_entities,
    intents,
    vocabVectors
  }
}

async function makeListEntityModel(entity: ListEntityWithCache, languageCode: string, tools: Tools) {
  const allValues = _.uniq(Object.keys(entity.synonyms).concat(..._.values(entity.synonyms)))
  const allTokens = (await tools.tokenize_utterances(allValues, languageCode)).map(toks =>
    toks.map(convertToRealSpaces)
  )

  const cache = warmEntityCache(entity.cache)

  return <WarmedListEntityModel>{
    type: 'custom.list',
    id: `custom.list.${entity.name}`,
    languageCode,
    entityName: entity.name,
    fuzzyTolerance: entity.fuzzyTolerance,
    sensitive: entity.sensitive,
    mappingsTokens: _.mapValues(entity.synonyms, (synonyms, name) =>
      [...synonyms, name].map(syn => {
        const idx = allValues.indexOf(syn)
        return allTokens[idx]
      })
    ),
    cache
  }
}

function computeKmeans(intents: Intent<Utterance>[], tools: Tools): sdk.MLToolkit.KMeans.KmeansResult | undefined {
  const data = _.chain(intents)
    .flatMap(i => i.utterances)
    .flatMap(u => u.tokens)
    .uniqBy((t: UtteranceToken) => t.value)
    .map((t: UtteranceToken) => t.vector)
    .value() as number[][]

  if (data.length < 2) {
    return
  }

  const k = data.length > NUM_CLUSTERS ? NUM_CLUSTERS : 2

  return tools.mlToolkit.KMeans.kmeans(data, k, KMEANS_OPTIONS)
}

async function ClusterTokens(input: TrainStep, tools: Tools): Promise<TrainStep> {
  const kmeans = computeKmeans(input.intents, tools)
  const copy = { ...input, kmeans }
  copy.intents.forEach(x => x.utterances.forEach(u => u.setKmeans(kmeans)))

  return copy
}

function buildVectorsVocab(intents: Intent<Utterance>[]): _.Dictionary<number[]> {
  return _.chain(intents)
    .flatMap((intent: Intent<Utterance>) => intent.utterances)
    .flatMap((utt: Utterance) => utt.tokens)
    .reduce((vocab, tok: UtteranceToken) => {
      vocab[tok.toString({ lowerCase: true })] = <number[]>tok.vector
      return vocab
    }, {} as Token2Vec)
    .value()
}

async function TrainIntentClassifiers(
  input: TrainStep,
  tools: Tools,
  progress: progressCB
): Promise<_.Dictionary<string>> {
  const { list_entities, pattern_entities, intents, ctxToTrain, nluSeed, languageCode } = input

  const svmPerCtx: _.Dictionary<string> = {}

  for (let i = 0; i < ctxToTrain.length; i++) {
    const ctx = ctxToTrain[i]

    const allUtterances = _.flatMap(intents, i => i.utterances)
    const trainableIntents = intents.filter(i => i.contexts.includes(ctx))

    const intentClf = new OOSIntentClassifier(tools, tools.logger)
    await intentClf.train(
      {
        languageCode,
        intents: trainableIntents,
        list_entities,
        nluSeed,
        pattern_entities,
        allUtterances
      },
      p => {
        const completion = (i + p) / input.ctxToTrain.length
        progress(completion)
      }
    )

    const model = intentClf.serialize()
    svmPerCtx[ctx] = model
  }

  return svmPerCtx
}

async function TrainContextClassifier(input: TrainStep, tools: Tools, progress: progressCB): Promise<string> {
  const { languageCode, intents, contexts, list_entities, pattern_entities, nluSeed } = input

  const rootIntents = contexts.map(ctx => {
    const utterances = _(intents)
      .filter(intent => intent.contexts.includes(ctx))
      .flatMap(intent => intent.utterances)
      .value()

    return <Intent<Utterance>>{
      name: ctx,
      contexts: [],
      slot_definitions: [],
      utterances
    }
  })

  const rootIntentClassifier = new SvmIntentClassifier(tools, getCtxFeatures)
  await rootIntentClassifier.train(
    {
      intents: rootIntents,
      languageCode,
      list_entities,
      pattern_entities,
      nluSeed
    },
    p => {
      progress(_.round(p, 1))
    }
  )

  return rootIntentClassifier.serialize()
}

async function ProcessIntents(
  intents: Intent<string>[],
  languageCode: string,
  tools: Tools
): Promise<Intent<Utterance>[]> {
  return Promise.map(intents, async intent => {
    const cleaned = intent.utterances.map(_.flow([_.trim, replaceConsecutiveSpaces]))
    const utterances = await buildUtteranceBatch(cleaned, languageCode, tools)
    return { ...intent, utterances }
  })
}

async function ExtractEntities(input: TrainStep, tools: Tools): Promise<TrainStep> {
  const utterances: Utterance[] = _.chain(input.intents)
    .flatMap('utterances')
    .value()

  // we extract sys entities for all utterances, helps on training and exact matcher
  const allSysEntities = await tools.systemEntityExtractor.extractMultiple(
    utterances.map(u => u.toString()),
    input.languageCode,
    true
  )

  _.zipWith(utterances, allSysEntities, (utt, sysEntities) => ({ utt, sysEntities }))
    .map(({ utt, sysEntities }) => {
      const listEntities = extractListEntitiesWithCache(utt, input.list_entities)
      const patternEntities = extractPatternEntities(utt, input.pattern_entities)
      return [utt, [...sysEntities, ...listEntities, ...patternEntities]] as [Utterance, EntityExtractionResult[]]
    })
    .forEach(([utt, entities]) => {
      entities.forEach(ent => {
        const entity: EntityExtractionResult = _.omit(ent, ['start, end']) as EntityExtractionResult
        utt.tagEntity(entity, ent.start, ent.end)
      })
    })

  return input
}

export async function TfidfTokens(input: TrainStep): Promise<TrainStep> {
  const tfidfInput = input.intents.reduce(
    (tfidfInput, intent) => ({
      ...tfidfInput,
      [intent.name]: _.flatMapDeep(intent.utterances.map(u => u.tokens.map(t => t.toString({ lowerCase: true }))))
    }),
    {} as _.Dictionary<string[]>
  )

  const { __avg__: avg_tfidf } = tfidf(tfidfInput)
  const copy = { ...input, tfIdf: avg_tfidf }
  copy.intents.forEach(x => x.utterances.forEach(u => u.setGlobalTfidf(avg_tfidf)))

  return copy
}

async function TrainSlotTaggers(input: TrainStep, tools: Tools, progress: progressCB): Promise<_.Dictionary<string>> {
  const slotModelByIntent: _.Dictionary<string> = {}

  for (let i = 0; i < input.intents.length; i++) {
    const intent = input.intents[i]

    const slotTagger = new SlotTagger(tools)

    await slotTagger.train(
      {
        intent,
        list_entites: input.list_entities
      },
      p => {
        const completion = (i + p) / input.intents.length
        progress(completion)
      }
    )

    slotModelByIntent[intent.name] = slotTagger.serialize()
  }

  return slotModelByIntent
}

const NB_STEPS = 5 // change this if the training pipeline changes

type AsyncFunction<A extends any[], R extends Promise<any>> = (...args: A) => R
const makeLogger = (trainId: string, logger?: Logger) => {
  return <A extends any[], R extends Promise<any>>(fn: AsyncFunction<A, R>) => (...args: A): R => {
    logger?.debug(`[${trainId}] Started ${fn.name}`)
    const ret = fn(...args)

    // awaiting if not responsibility of this logger decorator
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ret.then(() => logger?.debug(`[${trainId}] Done ${fn.name}`))

    return ret
  }
}

export const Trainer = async (input: TrainInput, tools: Tools, progress: (x: number) => void): Promise<TrainOutput> => {
  tools.logger?.debug(`[${input.trainId}] Started running training pipeline.`)

  let totalProgress = 0
  let normalizedProgress = 0

  const emptyProgress = () => {}
  const reportTrainingProgress = progress ?? emptyProgress

  const debouncedProgress = _.debounce(reportTrainingProgress, 75, { maxWait: 750 })
  const reportProgress: progressCB = (stepProgress = 1) => {
    totalProgress = Math.max(totalProgress, Math.floor(totalProgress) + _.round(stepProgress, 2))
    const scaledProgress = Math.min(1, _.round(totalProgress / NB_STEPS, 2))
    if (scaledProgress === normalizedProgress) {
      return
    }
    normalizedProgress = scaledProgress
    debouncedProgress(normalizedProgress)
  }
  const logger = makeLogger(input.trainId, tools.logger)

  reportTrainingProgress(0) // 0%

  let step = await logger(PreprocessInput)(input, tools)
  reportProgress() // 20%

  step = await logger(TfidfTokens)(step)
  step = await logger(ClusterTokens)(step, tools)
  step = await logger(ExtractEntities)(step, tools)
  reportProgress() // 40%

  const models = await Promise.all([
    logger(TrainContextClassifier)(step, tools, reportProgress),
    logger(TrainIntentClassifiers)(step, tools, reportProgress),
    logger(TrainSlotTaggers)(step, tools, reportProgress)
  ])

  debouncedProgress.flush()

  const [ctx_model, intent_model_by_ctx, slots_model_by_intent] = models

  const coldEntities: ColdListEntityModel[] = step.list_entities.map(e => ({
    ...e,
    cache: e.cache.dump()
  }))

  const output: TrainOutput = {
    list_entities: coldEntities,
    tfidf: step.tfIdf!,
    ctx_model,
    intent_model_by_ctx,
    slots_model_by_intent,
    contexts: input.contexts,
    vocab: Object.keys(step.vocabVectors),
    kmeans: step.kmeans && serializeKmeans(step.kmeans)
  }

  tools.logger?.debug(`[${input.trainId}] Done running training pipeline.`)
  return output
}
