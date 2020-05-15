import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { getOrCreateCache } from './cache-manager'
import { extractListEntities, extractPatternEntities } from './entities/custom-entity-extractor'
import { getSentenceEmbeddingForCtx } from './intents/context-classifier-featurizer'
import { isPOSAvailable } from './language/pos-tagger'
import { getStopWordsForLang } from './language/stopWords'
import { Model } from './model-service'
import { featurizeInScopeUtterances, featurizeOOSUtterances } from './out-of-scope-featurizer'
import SlotTagger from './slots/slot-tagger'
import { replaceConsecutiveSpaces } from './tools/strings'
import tfidf from './tools/tfidf'
import { convertToRealSpaces, isSpace, SPACE } from './tools/token-utils'
import {
  EntityExtractionResult,
  Intent,
  ListEntity,
  ListEntityModel,
  PatternEntity,
  TFIDF,
  Token2Vec,
  Tools,
  TrainingSession
} from './typings'
import Utterance, { buildUtteranceBatch, UtteranceToken, UtteranceToStringOptions } from './utterance/utterance'

// TODO make this return artefacts only and move the make model login in E2
export type Trainer = (input: TrainInput, tools: Tools) => Promise<Model>

export type TrainInput = Readonly<{
  botId: string
  languageCode: string
  pattern_entities: PatternEntity[]
  list_entities: ListEntity[]
  contexts: string[]
  intents: Intent<string>[]
  trainingSession: TrainingSession
}>

export type TrainOutput = Readonly<{
  botId: string
  languageCode: string
  list_entities: ListEntityModel[]
  pattern_entities: PatternEntity[]
  contexts: string[]
  intents: Intent<Utterance>[]
  vocabVectors: Token2Vec
  tfIdf?: TFIDF
  kmeans?: sdk.MLToolkit.KMeans.KmeansResult
}>

export interface TrainArtefacts {
  list_entities: ListEntityModel[]
  tfidf: TFIDF
  vocabVectors: Token2Vec
  // kmeans: KmeansResult
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
  slots: 'ignore',
  entities: 'ignore'
}
export const MIN_NB_UTTERANCES = 3
const NUM_CLUSTERS = 8
const KMEANS_OPTIONS = {
  iterations: 250,
  initialization: 'random',
  seed: 666 // so training is consistent
} as sdk.MLToolkit.KMeans.KMeansOptions

const PreprocessInput = async (input: TrainInput, tools: Tools): Promise<TrainOutput> => {
  debugTraining.forBot(input.botId, 'Preprocessing intents')
  input = _.cloneDeep(input)
  const list_entities = await Promise.map(input.list_entities, list =>
    makeListEntityModel(list, input.botId, input.languageCode, tools)
  )

  const intents = await ProcessIntents(input.intents, input.languageCode, list_entities, tools)
  const vocabVectors = buildVectorsVocab(intents)

  return {
    ..._.omit(input, 'list_entities', 'intents'),
    list_entities,
    intents,
    vocabVectors
  } as TrainOutput
}

const makeListEntityModel = async (entity: ListEntity, botId: string, languageCode: string, tools: Tools) => {
  const allValues = _.uniq(Object.keys(entity.synonyms).concat(..._.values(entity.synonyms)))
  const allTokens = (await tools.tokenize_utterances(allValues, languageCode)).map(toks =>
    toks.map(convertToRealSpaces)
  )

  return <ListEntityModel>{
    type: 'custom.list',
    id: `custom.list.${entity.name}`,
    languageCode: languageCode,
    entityName: entity.name,
    fuzzyTolerance: entity.fuzzyTolerance,
    sensitive: entity.sensitive,
    mappingsTokens: _.mapValues(entity.synonyms, (synonyms, name) =>
      [...synonyms, name].map(syn => {
        const idx = allValues.indexOf(syn)
        return allTokens[idx]
      })
    ),
    cache: getOrCreateCache(entity.name, botId)
  }
}

export const computeKmeans = (intents: Intent<Utterance>[], tools: Tools): sdk.MLToolkit.KMeans.KmeansResult => {
  const data = _.chain(intents)
    .filter(i => i.name !== NONE_INTENT)
    .flatMapDeep(i => i.utterances.map(u => u.tokens))
    // @ts-ignore
    .uniqBy((t: UtteranceToken) => t.value)
    .map((t: UtteranceToken) => t.vector)
    .value() as number[][]

  if (data.length < 2) {
    return
  }

  const k = data.length > NUM_CLUSTERS ? NUM_CLUSTERS : 2

  return tools.mlToolkit.KMeans.kmeans(data, k, KMEANS_OPTIONS)
}

const ClusterTokens = (input: TrainOutput, tools: Tools): TrainOutput => {
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
  return (
    _.chain(intents)
      .filter(i => i.name !== NONE_INTENT)
      .flatMapDeep((intent: Intent<Utterance>) => intent.utterances.map(u => u.tokens))
      // @ts-ignore
      .reduce((vocab, tok: UtteranceToken) => {
        vocab[tok.toString({ lowerCase: true })] = <number[]>tok.vector
        return vocab
      }, {})
      .value() as Token2Vec
  )
}

export const BuildExactMatchIndex = (input: TrainOutput): ExactMatchIndex => {
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

const TrainIntentClassifier = async (
  input: TrainOutput,
  tools: Tools,
  progress: progressCB
): Promise<_.Dictionary<string> | undefined> => {
  debugTraining.forBot(input.botId, 'Training intent classifier')
  const svmPerCtx: _.Dictionary<string> = {}

  const noneUtts = _.chain(input.intents)
    .filter(i => i.name === NONE_INTENT) // in case use defines a none intent we want to combine utterances
    .flatMap(i => i.utterances)
    .filter(u => u.tokens.filter(t => t.isWord).length >= 3)
    .value()

  for (let i = 0; i < input.contexts.length; i++) {
    const ctx = input.contexts[i]
    const trainableIntents = input.intents.filter(
      i => i.name !== NONE_INTENT && i.contexts.includes(ctx) && i.utterances.length >= MIN_NB_UTTERANCES
    )

    const nAvgUtts = Math.ceil(_.meanBy(trainableIntents, 'utterances.length'))
    const points = _.chain(trainableIntents)
      .thru(ints => [
        ...ints,
        {
          name: NONE_INTENT,
          utterances: _.chain(noneUtts)
            .shuffle()
            .take(nAvgUtts * 2.5) // undescriptible magic n, no sens to extract constant
            .value()
        }
      ])
      .flatMap(i =>
        i.utterances.map(utt => ({
          label: i.name,
          coordinates: [...utt.sentenceEmbedding, utt.tokens.length]
        }))
      )
      .filter(x => !x.coordinates.some(isNaN))
      .value()

    if (points.length <= 0) {
      progress(1 / input.contexts.length)
      continue
    }
    const svm = new tools.mlToolkit.SVM.Trainer()
    const model = await svm.train(points, { kernel: 'LINEAR', classifier: 'C_SVC' }, p => {
      const completion = (i + p) / input.contexts.length
      progress(completion)
    })
    svmPerCtx[ctx] = model
  }

  debugTraining.forBot(input.botId, 'Done training intent classifier')
  return svmPerCtx
}

const TrainContextClassifier = async (
  input: TrainOutput,
  tools: Tools,
  progress: progressCB
): Promise<string | undefined> => {
  debugTraining.forBot(input.botId, 'Training context classifier')
  const points = _.flatMapDeep(input.contexts, ctx => {
    return input.intents
      .filter(intent => intent.contexts.includes(ctx) && intent.name !== NONE_INTENT)
      .map(intent =>
        intent.utterances.map(utt => ({
          label: ctx,
          coordinates: getSentenceEmbeddingForCtx(utt)
        }))
      )
  }).filter(x => x.coordinates.filter(isNaN).length === 0)

  if (points.length === 0 || input.contexts.length <= 1) {
    progress()
    debugTraining.forBot(input.botId, 'No context to train')
    return
  }

  const svm = new tools.mlToolkit.SVM.Trainer()
  const model = await svm.train(points, { kernel: 'LINEAR', classifier: 'C_SVC' }, p => {
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

    return { ...intent, utterances: utterances, vocab, slot_entities: allowedEntities }
  })
}

export const ExtractEntities = async (input: TrainOutput, tools: Tools): Promise<TrainOutput> => {
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

  const customReferencedInSlots = _.chain(input.intents)
    .flatMap('slot_entities')
    .uniq()
    .value()

  // only extract list entities referenced in slots
  // TODO: remove this once we merge in entity encoding
  const listEntitiesToExtract = input.list_entities.filter(ent => customReferencedInSlots.includes(ent.entityName))
  const pattenEntitiesToExtract = input.pattern_entities.filter(ent => customReferencedInSlots.includes(ent.name))

  _.zip(utterances, allSysEntities)
    .map(([utt, sysEntities]) => {
      // TODO: remove this slot check once we merge in entity encoding
      const listEntities = utt.slots.length ? extractListEntities(utt, listEntitiesToExtract) : []
      const patternEntities = utt.slots.length ? extractPatternEntities(utt, pattenEntitiesToExtract) : []
      return [utt, [...sysEntities, ...listEntities, ...patternEntities]] as [Utterance, EntityExtractionResult[]]
    })
    .forEach(([utt, entities]) => {
      entities.forEach(ent => {
        utt.tagEntity(_.omit(ent, ['start, end']), ent.start, ent.end)
      })
    })
  return input
}

export const AppendNoneIntent = async (input: TrainOutput, tools: Tools): Promise<TrainOutput> => {
  if (input.intents.length === 0) {
    return input
  }

  const allUtterances = _.flatten(input.intents.map(x => x.utterances))
  const vocabWithDupes = _.chain(allUtterances)
    .map(x => x.tokens.map(x => x.value))
    .flattenDeep<string>()
    .value()

  const junkWords = await tools.generateSimilarJunkWords(Object.keys(input.vocabVectors), input.languageCode)
  const avgTokens = _.meanBy(allUtterances, x => x.tokens.length)
  const nbOfNoneUtterances = _.clamp(
    (allUtterances.length * 2) / 3,
    NONE_UTTERANCES_BOUNDS.MIN,
    NONE_UTTERANCES_BOUNDS.MAX
  )
  const stopWords = await getStopWordsForLang(input.languageCode)
  const vocabWords = _.chain(input.tfIdf)
    .toPairs()
    .filter(([word, tfidf]) => tfidf <= 0.3)
    .map('0')
    .value()

  // If 30% in utterances is a space, language is probably space-separated so we'll join tokens using spaces
  const joinChar = vocabWithDupes.filter(x => isSpace(x)).length >= vocabWithDupes.length * 0.3 ? SPACE : ''

  const vocabUtts = _.range(0, nbOfNoneUtterances).map(() => {
    const nbWords = Math.round(_.random(1, avgTokens * 2, false))
    return _.sampleSize(_.uniq([...stopWords, ...vocabWords]), nbWords).join(joinChar)
  })

  const junkWordsUtts = _.range(0, nbOfNoneUtterances).map(() => {
    const nbWords = Math.round(_.random(1, avgTokens * 2, false))
    return _.sampleSize(junkWords, nbWords).join(joinChar)
  })

  const mixedUtts = _.range(0, nbOfNoneUtterances).map(() => {
    const nbWords = Math.round(_.random(1, avgTokens * 2, false))
    return _.sampleSize([...junkWords, ...stopWords], nbWords).join(joinChar)
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

export const TfidfTokens = async (input: TrainOutput): Promise<TrainOutput> => {
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

const TrainSlotTagger = async (input: TrainOutput, tools: Tools, progress: progressCB): Promise<Buffer> => {
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

const TrainOutOfScope = async (
  input: TrainOutput,
  tools: Tools,
  progress: progressCB
): Promise<_.Dictionary<string>> => {
  debugTraining.forBot(input.botId, 'Training out of scope classifier')
  const trainingOptions: sdk.MLToolkit.SVM.SVMOptions = {
    c: [10],
    gamma: [0.1],
    kernel: 'LINEAR',
    classifier: 'C_SVC'
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
  const ctxModels: [string, string][] = await Promise.map(input.contexts, async ctx => {
    const in_ctx_scope_points = _.chain(input.intents)
      .filter(i => i.name !== NONE_INTENT && i.contexts.includes(ctx))
      .flatMap(i => featurizeInScopeUtterances(i.utterances, i.name))
      .value()

    const svm = new tools.mlToolkit.SVM.Trainer()
    const model = await svm.train([...in_ctx_scope_points, ...oos_points], trainingOptions, p => {
      combinedProgress += p / input.contexts.length
      progress(combinedProgress)
    })
    return [ctx, model] as [string, string]
  })

  debugTraining.forBot(input.botId, 'Done training out of scope')
  progress(1)
  return ctxModels.reduce((acc, [ctx, model]) => {
    acc[ctx] = model
    return acc
  }, {})
}

const NB_STEPS = 5 // change this if the training pipeline changes
export const Trainer: Trainer = async (input: TrainInput, tools: Tools): Promise<Model> => {
  const model: Partial<Model> = {
    startedAt: new Date(),
    languageCode: input.languageCode,
    data: {
      input
    }
  }

  let totalProgress = 0
  let normalizedProgress = 0
  const debouncedProgress = _.debounce(tools.reportTrainingProgress, 75, { maxWait: 750 })
  const reportProgress: progressCB = (stepProgress = 1) => {
    if (!input.trainingSession) {
      return
    }
    if (input.trainingSession.status === 'canceled') {
      // Note that we don't use debouncedProgress here as we want the side effects probagated now
      tools.reportTrainingProgress(input.botId, 'Training canceled', input.trainingSession)
      throw new TrainingCanceledError()
    }

    totalProgress = Math.max(totalProgress, Math.floor(totalProgress) + _.round(stepProgress, 2))
    const scaledProgress = Math.min(1, _.round(totalProgress / NB_STEPS, 2))
    if (scaledProgress === normalizedProgress) {
      return
    }
    normalizedProgress = scaledProgress
    debouncedProgress(input.botId, 'Training', { ...input.trainingSession, progress: normalizedProgress })
  }
  try {
    let output = await PreprocessInput(input, tools)
    output = await TfidfTokens(output)
    output = ClusterTokens(output, tools)
    output = await ExtractEntities(output, tools)
    output = await AppendNoneIntent(output, tools)
    const exact_match_index = BuildExactMatchIndex(output)
    reportProgress()
    const [oos_model, ctx_model, intent_model_by_ctx, slots_model] = await Promise.all([
      TrainOutOfScope(output, tools, reportProgress),
      TrainContextClassifier(output, tools, reportProgress),
      TrainIntentClassifier(output, tools, reportProgress),
      TrainSlotTagger(output, tools, reportProgress)
    ])

    const artefacts: TrainArtefacts = {
      list_entities: output.list_entities,
      oos_model,
      tfidf: output.tfIdf,
      ctx_model,
      intent_model_by_ctx,
      slots_model,
      vocabVectors: output.vocabVectors,
      exact_match_index
      // kmeans: {} add this when mlKmeans supports loading from serialized data,
    }

    _.merge(model, { success: true, data: { artefacts, output } })
  } catch (err) {
    if (err instanceof TrainingCanceledError) {
      debugTraining.forBot(input.botId, 'Training aborted')
    } else {
      // TODO use bp.logger once this is moved in Engine2
      console.log('Could not finish training NLU model', err)
    }
    model.success = false
  } finally {
    model.finishedAt = new Date()
    return model as Model
  }
}

class TrainingCanceledError extends Error {
  constructor() {
    super('Training cancelled')
    this.name = 'CancelError'
  }
}
