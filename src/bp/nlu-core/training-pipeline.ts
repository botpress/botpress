import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { extractListEntitiesWithCache, extractPatternEntities } from './entities/custom-entity-extractor'
import { warmEntityCache } from './entities/entity-cache-manager'
import { getCtxFeatures } from './intents/context-featurizer'
import { getIntentFeatures } from './intents/intent-featurizer'
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
  ListEntityModel,
  PatternEntity,
  TFIDF,
  Token2Vec,
  Tools,
  WarmedListEntityModel
} from './typings'
import Utterance, { buildUtteranceBatch, UtteranceToken, UtteranceToStringOptions } from './utterance/utterance'

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
  botId: string
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
  // kmeans: KmeansResult
  contexts: string[]
  ctx_model: string
  intent_model_by_ctx: Dic<string>
  slots_model: Buffer
  exact_match_index: ExactMatchIndex
  oos_model: _.Dictionary<string>
}

export type ExactMatchIndex = _.Dictionary<{ intent: string; contexts: string[] }>

type progressCB = (p?: number) => void

const debugTraining = DEBUG('nlu').sub('training')
const NONE_INTENT = 'none'
const NONE_UTTERANCES_BOUNDS = {
  MIN: 20,
  MAX: 200
}
export const EXACT_MATCH_STR_OPTIONS: UtteranceToStringOptions = {
  lowerCase: true,
  onlyWords: true,
  slots: 'keep-value', // slot extraction is done in || with intent prediction
  entities: 'keep-name'
}
export const MIN_NB_UTTERANCES = 3
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

  const intents = await ProcessIntents(input.intents, input.languageCode, list_entities, tools)
  const vocabVectors = buildVectorsVocab(intents)

  return {
    ..._.omit(input, 'list_entities', 'intents'),
    list_entities,
    intents,
    vocabVectors
  } as TrainStep
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

export const buildIntentVocab = (utterances: Utterance[], intentEntities: ListEntityModel[]): _.Dictionary<boolean> => {
  // @ts-ignore
  const entitiesTokens: string[] = _.chain(intentEntities)
    .flatMapDeep(e => Object.values(e.mappingsTokens))
    .map((t: string) => t.toLowerCase().replace(SPACE, ' '))
    .value()

  return _.chain(utterances)
    .flatMap(u => u.tokens.filter(t => _.isEmpty(t.slots)).map(t => t.toString({ lowerCase: true })))
    .concat(entitiesTokens)
    .reduce((vocab: _.Dictionary<boolean>, tok) => ({ ...vocab, [tok]: true }), {})
    .value()
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

export const BuildExactMatchIndex = (input: TrainStep): ExactMatchIndex => {
  return _.chain(input.intents)
    .filter(i => i.name !== NONE_INTENT)
    .flatMap(i =>
      i.utterances.map(u => ({
        utterance: u.toString(EXACT_MATCH_STR_OPTIONS),
        contexts: i.contexts,
        intent: i.name
      }))
    )
    .filter(({ utterance }) => !!utterance)
    .reduce((index, { utterance, contexts, intent }) => {
      index[utterance] = { intent, contexts }
      return index
    }, {} as ExactMatchIndex)
    .value()
}

const getCustomEntitiesNames = (input: TrainStep): string[] => {
  return [...input.list_entities.map(e => e.entityName), ...input.pattern_entities.map(e => e.name)]
}

const TrainIntentClassifier = async (
  input: TrainStep,
  tools: Tools,
  progress: progressCB
): Promise<_.Dictionary<string>> => {
  debugTraining.forBot(input.botId, 'Training intent classifier')
  const customEntities = getCustomEntitiesNames(input)
  const svmPerCtx: _.Dictionary<string> = {}

  const noneUtts = _.chain(input.intents)
    .filter(i => i.name === NONE_INTENT) // in case use defines a none intent we want to combine utterances
    .flatMap(i => i.utterances)
    .filter(u => u.tokens.filter(t => t.isWord).length >= 3)
    .value()

  const lo = tools.seededLodashProvider.getSeededLodash()
  for (let i = 0; i < input.ctxToTrain.length; i++) {
    const ctx = input.ctxToTrain[i]
    const trainableIntents = input.intents.filter(
      i => i.name !== NONE_INTENT && i.contexts.includes(ctx) && i.utterances.length >= MIN_NB_UTTERANCES
    )

    const nAvgUtts = Math.ceil(_.meanBy(trainableIntents, 'utterances.length'))

    const points = _.chain(trainableIntents)
      .thru(ints => [
        ...ints,
        {
          name: NONE_INTENT,
          utterances: lo
            .chain(noneUtts)
            .shuffle()
            .take(nAvgUtts * 2.5) // undescriptible magic n, no sens to extract constant
            .value()
        }
      ])
      .flatMap(i =>
        i.utterances.map(utt => ({
          label: i.name,
          coordinates: getIntentFeatures(utt, customEntities)
        }))
      )
      .filter(x => !x.coordinates.some(isNaN))
      .value()

    if (points.length <= 0) {
      progress(1 / input.ctxToTrain.length)
      continue
    }
    const svm = new tools.mlToolkit.SVM.Trainer()

    const seed = input.nluSeed
    const model = await svm.train(points, { kernel: 'LINEAR', classifier: 'C_SVC', seed }, p => {
      const completion = (i + p) / input.ctxToTrain.length
      progress(completion)
    })
    svmPerCtx[ctx] = model
  }

  debugTraining.forBot(input.botId, 'Done training intent classifier')
  return svmPerCtx
}

const TrainContextClassifier = async (input: TrainStep, tools: Tools, progress: progressCB): Promise<string> => {
  debugTraining.forBot(input.botId, 'Training context classifier')
  const customEntities = getCustomEntitiesNames(input)
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
    debugTraining.forBot(input.botId, 'No context to train')
    return ''
  }

  const svm = new tools.mlToolkit.SVM.Trainer()

  const seed = input.nluSeed
  const model = await svm.train(points, { kernel: 'LINEAR', classifier: 'C_SVC', seed }, p => {
    progress(_.round(p, 1))
  })

  debugTraining.forBot(input.botId, 'Done training context classifier')
  return model
}

export const ProcessIntents = async (
  intents: Intent<string>[],
  languageCode: string,
  list_entities: ListEntityModel[],
  tools: Tools
): Promise<Intent<Utterance>[]> => {
  return Promise.map(intents, async intent => {
    const cleaned = intent.utterances.map(_.flow([_.trim, replaceConsecutiveSpaces]))
    const utterances = await buildUtteranceBatch(cleaned, languageCode, tools)

    const allowedEntities = _.chain(intent.slot_definitions)
      .flatMap(s => s.entities)
      .filter(e => e !== 'any')
      .uniq()
      .value() as string[]

    const entityModels = _.intersectionWith(list_entities, allowedEntities, (entity, name) => {
      return entity.entityName === name
    })

    const vocab = buildIntentVocab(utterances, entityModels)

    return { ...intent, utterances, vocab, slot_entities: allowedEntities }
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

  // TODO: we should filter out augmented + we should create none utterances by context
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
    contexts: [...input.contexts],
    vocab: {},
    slot_entities: []
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

  debugTraining.forBot(input.botId, 'Training slot tagger')
  const slotTagger = new SlotTagger(tools.mlToolkit)

  await slotTagger.train(input.intents.filter(i => i.name !== NONE_INTENT))

  debugTraining.forBot(input.botId, 'Done training slot tagger')
  progress()

  return slotTagger.serialized
}

const TrainOutOfScope = async (input: TrainStep, tools: Tools, progress: progressCB): Promise<_.Dictionary<string>> => {
  debugTraining.forBot(input.botId, 'Training out of scope classifier')
  const trainingOptions: sdk.MLToolkit.SVM.SVMOptions = {
    c: [10], // so there's no grid search
    kernel: 'LINEAR',
    classifier: 'C_SVC',
    seed: input.nluSeed
  }

  const noneUtts = _.chain(input.intents)
    .filter(i => i.name === NONE_INTENT)
    .flatMap(i => i.utterances)
    .value()

  if (!isPOSAvailable(input.languageCode) || noneUtts.length === 0) {
    progress()
    return {}
  }

  const oos_points = featurizeOOSUtterances(noneUtts, input.vocabVectors, tools)
  let combinedProgress = 0

  type ContextModel = [string, string]
  const ctxModels: ContextModel[] = await Promise.map(input.ctxToTrain, async ctx => {
    const in_ctx_scope_points = _.chain(input.intents)
      .filter(i => i.name !== NONE_INTENT && i.contexts.includes(ctx))
      .flatMap(i => featurizeInScopeUtterances(i.utterances, i.name))
      .value()

    const svm = new tools.mlToolkit.SVM.Trainer()
    const model = await svm.train([...in_ctx_scope_points, ...oos_points], trainingOptions, p => {
      combinedProgress += p / input.ctxToTrain.length
      progress(combinedProgress)
    })

    return [ctx, model] as [string, string]
  })

  debugTraining.forBot(input.botId, 'Done training out of scope')
  progress(1)
  return ctxModels.reduce((acc, cur) => {
    const [ctx, model] = cur!
    acc[ctx] = model
    return acc
  }, {} as _.Dictionary<string>)
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
  const exact_match_index = BuildExactMatchIndex(step)
  reportProgress() // 20%

  const models = await Promise.all([
    TrainOutOfScope(step, tools, reportProgress),
    TrainContextClassifier(step, tools, reportProgress),
    TrainIntentClassifier(step, tools, reportProgress),
    TrainSlotTagger(step, tools, reportProgress)
  ])

  debouncedProgress.flush()

  const [oos_model, ctx_model, intent_model_by_ctx, slots_model] = models

  const coldEntities: ColdListEntityModel[] = step.list_entities.map(e => ({
    ...e,
    cache: e.cache.dump()
  }))

  const output: TrainOutput = {
    list_entities: coldEntities,
    oos_model: oos_model!,
    tfidf: step.tfIdf!,
    ctx_model: ctx_model!,
    intent_model_by_ctx: intent_model_by_ctx!,
    slots_model: slots_model!,
    vocabVectors: step.vocabVectors,
    exact_match_index,
    // kmeans: {} add this when mlKmeans supports loading from serialized data,
    contexts: input.contexts
  }

  return output
}
