import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { serializeKmeans } from './clustering'
import { extractListEntitiesWithCache, extractPatternEntities } from './entities/custom-entity-extractor'
import { warmEntityCache } from './entities/entity-cache-manager'
import { getCtxFeatures } from './intents/context-featurizer'
import { OOSIntentClassifier } from './intents/oos-intent-classfier'
import { isPOSAvailable } from './language/pos-tagger'
import { getStopWordsForLang } from './language/stopWords'
import { featurizeInScopeUtterances, featurizeOOSUtterances } from './out-of-scope-featurizer'
import SlotTagger from './slots/slot-tagger'
import { replaceConsecutiveSpaces } from './tools/strings'
import tfidf, { SMALL_TFIDF } from './tools/tfidf'
import { convertToRealSpaces, isSpace, SPACE } from './tools/token-utils'
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
  Tools,
  WarmedListEntityModel
} from './typings'
import Utterance, { buildUtteranceBatch, UtteranceToken } from './utterance/utterance'

type ListEntityWithCache = ListEntity & {
  cache: EntityCacheDump
}

export type TrainInput = Readonly<{
  nluSeed: number
  languageCode: string
  pattern_entities: PatternEntity[]
  list_entities: ListEntityWithCache[]
  contexts: string[]
  intents: Intent<string>[]
  ctxToTrain: string[]
}>

export type TrainStep = Readonly<{
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
  vocabVectors: Token2Vec
  kmeans: SerializedKmeansResult | undefined
  contexts: string[]
  ctx_model: string
  intent_model_by_ctx: Dic<string>
  slots_model: Buffer
}

type progressCB = (p?: number) => void

const debugTraining = DEBUG('nlu').sub('training') // TODO: make sure logs get wired up to web process
export const NONE_INTENT = 'none'
const NONE_UTTERANCES_BOUNDS = {
  MIN: 20,
  MAX: 200
}

const NUM_CLUSTERS = 8
const KMEANS_OPTIONS = {
  iterations: 250,
  initialization: 'random',
  seed: 666 // so training is consistent
} as sdk.MLToolkit.KMeans.KMeansOptions

const PreprocessInput = async (input: TrainInput, tools: Tools): Promise<TrainStep> => {
  debugTraining('Preprocessing intents')
  input = _.cloneDeep(input)
  const list_entities = await Promise.map(input.list_entities, list =>
    makeListEntityModel(list, input.languageCode, tools)
  )

  const intents = await ProcessIntents(input.intents, input.languageCode, tools)
  const vocabVectors = buildVectorsVocab(intents)

  const { nluSeed, languageCode, pattern_entities, contexts, ctxToTrain } = input
  return {
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

const makeListEntityModel = async (entity: ListEntityWithCache, languageCode: string, tools: Tools) => {
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

export const computeKmeans = (
  intents: Intent<Utterance>[],
  tools: Tools
): sdk.MLToolkit.KMeans.KmeansResult | undefined => {
  const data = _.chain(intents)
    .filter(i => i.name !== NONE_INTENT)
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

const ClusterTokens = (input: TrainStep, tools: Tools): TrainStep => {
  const kmeans = computeKmeans(input.intents, tools)
  const copy = { ...input, kmeans }
  copy.intents.forEach(x => x.utterances.forEach(u => u.setKmeans(kmeans)))

  return copy
}

const buildVectorsVocab = (intents: Intent<Utterance>[]): _.Dictionary<number[]> => {
  return _.chain(intents)
    .filter(i => i.name !== NONE_INTENT)
    .flatMap((intent: Intent<Utterance>) => intent.utterances)
    .flatMap((utt: Utterance) => utt.tokens)
    .reduce((vocab, tok: UtteranceToken) => {
      vocab[tok.toString({ lowerCase: true })] = <number[]>tok.vector
      return vocab
    }, {} as Token2Vec)
    .value()
}

const TrainIntentClassifiers = async (
  input: TrainStep,
  tools: Tools,
  progress: progressCB
): Promise<_.Dictionary<string>> => {
  debugTraining('Training intent classifier')

  const { list_entities, pattern_entities, intents, ctxToTrain, nluSeed } = input

  const svmPerCtx: _.Dictionary<string> = {}

  for (let i = 0; i < ctxToTrain.length; i++) {
    const ctx = ctxToTrain[i]

    const allUtterances = _(intents)
      .filter(i => i.name !== NONE_INTENT)
      .flatMap(i => i.utterances)
      .value()
    const trainableIntents = intents.filter(i => i.contexts.includes(ctx) && i.name !== NONE_INTENT)
    const [noneIntent] = intents.filter(i => i.name === NONE_INTENT)

    const intentClf = new OOSIntentClassifier(tools)
    await intentClf.train(
      {
        intents: trainableIntents,
        list_entities,
        nluSeed,
        pattern_entities,
        noneIntent,
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

  debugTraining('Done training intent classifier')
  return svmPerCtx
}

const TrainContextClassifier = async (input: TrainStep, tools: Tools, progress: progressCB): Promise<string> => {
  debugTraining('Training context classifier')

  const { list_entities, pattern_entities } = input
  const customEntities = [...list_entities.map(e => e.entityName), ...pattern_entities.map(e => e.name)]

  const points = _.flatMapDeep(input.contexts, ctx => {
    return input.intents
      .filter(intent => intent.contexts.includes(ctx) && intent.name !== NONE_INTENT)
      .map(intent =>
        intent.utterances.map(utt => ({
          label: ctx,
          coordinates: getCtxFeatures(utt, customEntities)
        }))
      )
  }).filter(x => x.coordinates.filter(isNaN).length === 0)

  const classCount = _.uniq(points.map(p => p.label)).length
  if (points.length === 0 || classCount <= 1) {
    progress()
    debugTraining('No context to train')
    return ''
  }

  const svm = new tools.mlToolkit.SVM.Trainer()

  const seed = input.nluSeed
  const model = await svm.train(points, { kernel: 'LINEAR', classifier: 'C_SVC', seed }, p => {
    progress(_.round(p, 1))
  })

  debugTraining('Done training context classifier')
  return model
}

export const ProcessIntents = async (
  intents: Intent<string>[],
  languageCode: string,
  tools: Tools
): Promise<Intent<Utterance>[]> => {
  return Promise.map(intents, async intent => {
    const cleaned = intent.utterances.map(_.flow([_.trim, replaceConsecutiveSpaces]))
    const utterances = await buildUtteranceBatch(cleaned, languageCode, tools)
    return { ...intent, utterances }
  })
}

export const ExtractEntities = async (input: TrainStep, tools: Tools): Promise<TrainStep> => {
  const utterances: Utterance[] = _.chain(input.intents)
    .filter(i => i.name !== NONE_INTENT)
    .flatMap('utterances')
    .value()

  // we extract sys entities for all utterances, helps on training and exact matcher
  const allSysEntities = await tools.duckling.extractMultiple(
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

export const AppendNoneIntent = async (input: TrainStep, tools: Tools): Promise<TrainStep> => {
  if (input.intents.length === 0) {
    return input
  }

  const lo = tools.seededLodashProvider.getSeededLodash()

  const allUtterances = lo.flatten(input.intents.map(x => x.utterances))
  const vocabWithDupes = lo
    .chain(allUtterances)
    .map(x => x.tokens.map(x => x.value))
    .flattenDeep<string>()
    .value()

  const junkWords = await tools.generateSimilarJunkWords(Object.keys(input.vocabVectors), input.languageCode)
  const avgTokens = lo.meanBy(allUtterances, x => x.tokens.length)
  const nbOfNoneUtterances = lo.clamp(
    (allUtterances.length * 2) / 3,
    NONE_UTTERANCES_BOUNDS.MIN,
    NONE_UTTERANCES_BOUNDS.MAX
  )
  const stopWords = await getStopWordsForLang(input.languageCode)
  const vocabWords = lo
    .chain(input.tfIdf)
    .toPairs()
    .filter(([word, tfidf]) => tfidf <= SMALL_TFIDF)
    .map('0')
    .value()

  // If 30% in utterances is a space, language is probably space-separated so we'll join tokens using spaces
  const joinChar = vocabWithDupes.filter(x => isSpace(x)).length >= vocabWithDupes.length * 0.3 ? SPACE : ''

  const vocabUtts = lo.range(0, nbOfNoneUtterances).map(() => {
    const nbWords = Math.round(lo.random(1, avgTokens * 2, false))
    return lo.sampleSize(lo.uniq([...stopWords, ...vocabWords]), nbWords).join(joinChar)
  })

  const junkWordsUtts = lo.range(0, nbOfNoneUtterances).map(() => {
    const nbWords = Math.round(lo.random(1, avgTokens * 2, false))
    return lo.sampleSize(junkWords, nbWords).join(joinChar)
  })

  const mixedUtts = lo.range(0, nbOfNoneUtterances).map(() => {
    const nbWords = Math.round(lo.random(1, avgTokens * 2, false))
    return lo.sampleSize([...junkWords, ...stopWords], nbWords).join(joinChar)
  })

  const intent: Intent<Utterance> = {
    name: NONE_INTENT,
    slot_definitions: [],
    utterances: await buildUtteranceBatch(
      [...mixedUtts, ...vocabUtts, ...junkWordsUtts, ...stopWords],
      input.languageCode,
      tools
    ),
    contexts: [...input.contexts]
  }

  return { ...input, intents: [...input.intents, intent] }
}

export const TfidfTokens = async (input: TrainStep): Promise<TrainStep> => {
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

const TrainSlotTagger = async (input: TrainStep, tools: Tools, progress: progressCB): Promise<Buffer> => {
  const hasSlots = _.flatMap(input.intents, i => i.slot_definitions).length > 0

  if (!hasSlots) {
    progress()
    return Buffer.from('')
  }

  debugTraining('Training slot tagger')
  const slotTagger = new SlotTagger(tools.mlToolkit)

  await slotTagger.train(
    input.intents.filter(i => i.name !== NONE_INTENT),
    input.list_entities
  )

  debugTraining('Done training slot tagger')
  progress()

  return slotTagger.serialized
}

const NB_STEPS = 6 // change this if the training pipeline changes

export const Trainer = async (
  input: TrainInput,
  tools: Tools,
  progress?: (x: number) => void
): Promise<TrainOutput> => {
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

  reportTrainingProgress(0) // 0%

  let step = await PreprocessInput(input, tools)
  reportProgress() // 10%

  step = await TfidfTokens(step)
  step = ClusterTokens(step, tools)
  step = await ExtractEntities(step, tools)
  step = await AppendNoneIntent(step, tools)
  reportProgress() // 20%

  const models = await Promise.all([
    TrainContextClassifier(step, tools, reportProgress),
    TrainIntentClassifiers(step, tools, reportProgress),
    TrainSlotTagger(step, tools, reportProgress)
  ])

  debouncedProgress.flush()

  const [ctx_model, intent_model_by_ctx, slots_model] = models

  const coldEntities: ColdListEntityModel[] = step.list_entities.map(e => ({
    ...e,
    cache: e.cache.dump()
  }))

  const output: TrainOutput = {
    list_entities: coldEntities,
    tfidf: step.tfIdf!,
    ctx_model,
    intent_model_by_ctx,
    slots_model,
    vocabVectors: step.vocabVectors,
    kmeans: step.kmeans && serializeKmeans(step.kmeans),
    contexts: input.contexts
  }

  return output
}
