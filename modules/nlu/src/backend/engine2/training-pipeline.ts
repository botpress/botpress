import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import tfidf from '../pipelines/intents/tfidf'
import { replaceConsecutiveSpaces } from '../tools/strings'
import { averageVectors } from '../tools/math'
import { isSpace, SPACE, mergeSimilarCharsetTokens } from '../tools/token-utils'
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
} from '../typings'

import CRFExtractor2 from './crf-extractor2'
import { extractListEntities, extractPatternEntities, mapE1toE2Entity } from './entity-extractor'
import { Model } from './model-service'
import Utterance, { buildUtteranceBatch, UtteranceToken, UtteranceToStringOptions } from './utterance'
import { makePOSdic, POS_CLASSES, POS1_SET, POS2_SET, POS3_SET, POS4_SET } from '../pos-tagger'
import { encodeOH } from '../tools/encoder'

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
  languageCode: string
  list_entities: ListEntityModel[]
  pattern_entities: PatternEntity[]
  contexts: string[]
  intents: Intent<Utterance>[]
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
}

export type ExactMatchIndex = _.Dictionary<{ intent: string; contexts: string[] }>

type progressCB = (p?: number) => void

const debugTraining = DEBUG('nlu').sub('training')
const debugIntentsTrain = debugTraining.sub('intents')
const NONE_INTENT = 'none'
export const EXACT_MATCH_STR_OPTIONS: UtteranceToStringOptions = {
  lowerCase: true,
  onlyWords: true,
  slots: 'ignore',
  entities: 'ignore'
}
export const MIN_NB_UTTERANCES = 3
const SVM_OPTIONS = { kernel: 'LINEAR', classifier: 'C_SVC' } as sdk.MLToolkit.SVM.SVMOptions
// TODO grid search / optimization for those hyperparams
const NUM_CLUSTERS = 8
const KMEANS_OPTIONS = {
  iterations: 250,
  initialization: 'random',
  seed: 666 // so training is consistent
} as sdk.MLToolkit.KMeans.KMeansOptions

const preprocessInput = async (input: TrainInput, tools: Tools): Promise<TrainOutput> => {
  input = _.cloneDeep(input)
  const list_entities = await Promise.map(input.list_entities, list =>
    makeListEntityModel(list, input.languageCode, tools)
  )

  const intents = await ProcessIntents(input.intents, input.languageCode, list_entities, tools)

  return {
    ..._.omit(input, 'list_entities', 'intents'),
    list_entities,
    intents
  } as TrainOutput
}

const makeListEntityModel = async (entity: ListEntity, languageCode: string, tools: Tools) => {
  const allValues = _.uniq(Object.keys(entity.synonyms).concat(..._.values(entity.synonyms)))
  const allTokens = await tools.tokenize_utterances(allValues, languageCode)

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
    )
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
  return _.chain(intents)
    .filter(i => i.name !== NONE_INTENT)
    .flatMapDeep((intent: Intent<Utterance>) => intent.utterances.map(u => u.tokens))
    .reduce(
      // @ts-ignore
      (vocab, tok: UtteranceToken) => ({ ...vocab, [tok.toString({ lowerCase: true })]: tok.vector }),
      {} as Token2Vec
    )
    .value() as Token2Vec
}

export const buildExactMatchIndex = (input: TrainOutput): ExactMatchIndex => {
  return _.chain(input.intents)
    .filter(i => i.name !== NONE_INTENT)
    .flatMap(i =>
      i.utterances.map(u => ({
        utterance: u.toString(EXACT_MATCH_STR_OPTIONS),
        contexts: i.contexts,
        intent: i.name
      }))
    )
    .reduce(
      (index, { utterance, contexts, intent }) => ({ ...index, [utterance]: { intent, contexts } }),
      {} as ExactMatchIndex
    )
    .value()
}

const trainIntentClassifier = async (
  input: TrainOutput,
  tools: Tools,
  progress: progressCB
): Promise<_.Dictionary<string> | undefined> => {
  const svmPerCtx: _.Dictionary<string> = {}
  const n_ctx = input.contexts.length
  for (const ctx of input.contexts) {
    const points = _.chain(input.intents)
      .filter(i => i.contexts.includes(ctx) && i.utterances.length >= MIN_NB_UTTERANCES)
      .flatMap(i =>
        i.utterances.map(utt => ({
          label: i.name,
          coordinates: utt.sentenceEmbedding
        }))
      )
      .value()
      .filter(x => x.coordinates.filter(isNaN).length == 0)

    if (points.length > 0) {
      const svm = new tools.mlToolkit.SVM.Trainer()
      let progressCalls = 0
      svmPerCtx[ctx] = await svm.train(points, SVM_OPTIONS, p => {
        if (++progressCalls % 5 === 0) {
          debugIntentsTrain('svm progress ==> %d', p)
          progress(_.round(p / n_ctx, 1))
        }
      })
    } else {
      progress(1 / n_ctx)
    }
  }

  return svmPerCtx
}

const trainContextClassifier = async (
  input: TrainOutput,
  tools: Tools,
  progress: progressCB
): Promise<string | undefined> => {
  const points = _.flatMapDeep(input.contexts, ctx => {
    return input.intents
      .filter(intent => intent.contexts.includes(ctx) && intent.name !== NONE_INTENT)
      .map(intent =>
        intent.utterances.map(utt => ({
          label: ctx,
          coordinates: utt.sentenceEmbedding
        }))
      )
  }).filter(x => x.coordinates.filter(isNaN).length == 0)

  if (points.length > 0) {
    const svm = new tools.mlToolkit.SVM.Trainer()
    let progressCalls = 0
    return svm.train(points, SVM_OPTIONS, p => {
      if (++progressCalls % 5 === 0) {
        progress(_.round(p, 1))
        debugIntentsTrain('svm progress ==> %d', p)
      }
    })
  }
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
  const utterances = _.flatMap(input.intents.map(i => i.utterances))

  const allSysEntities = (
    await tools.duckling.extractMultiple(
      utterances.map(u => u.toString()),
      input.languageCode,
      true
    )
  ).map(ents => ents.map(mapE1toE2Entity))

  _.zip(utterances, allSysEntities)
    .map(([utt, sysEntities]) => {
      const listEntities = extractListEntities(utt, input.list_entities)
      const patternEntities = extractPatternEntities(utt, input.pattern_entities)
      return [utt, [...sysEntities, ...listEntities, ...patternEntities]] as [Utterance, EntityExtractionResult[]]
    })
    .forEach(([utt, entities]) => {
      entities.forEach(ent => {
        utt.tagEntity(_.omit(ent, ['start, end']), ent.start, ent.end)
      })
    })

  return input
}

export const AppendNoneIntents = async (input: TrainOutput, tools: Tools): Promise<TrainOutput> => {
  if (input.intents.length === 0) {
    return input
  }

  const allUtterances = _.flatten(input.intents.map(x => x.utterances))
  const vocabWithDupes = _.chain(allUtterances)
    .map(x => x.tokens.map(x => x.value))
    .flattenDeep<string>()
    .value()

  const junkWords = await tools.generateSimilarJunkWords(_.uniq(vocabWithDupes), input.languageCode)
  const avgUtterances = _.meanBy(input.intents, x => x.utterances.length)
  const avgTokens = _.meanBy(allUtterances, x => x.tokens.length)
  const nbOfNoneUtterances = Math.max(5, 500)

  // If 30% in utterances is a space, language is probably space-separated so we'll join tokens using spaces
  const joinChar = vocabWithDupes.filter(x => isSpace(x)).length >= vocabWithDupes.length * 0.3 ? SPACE : ''

  const noneUtterances = _.range(0, nbOfNoneUtterances).map(() => {
    const nbWords = Math.round(_.random(1, avgTokens * 1.5, false))
    return _.sampleSize(junkWords, nbWords).join(joinChar)
  })

  const intent: Intent<Utterance> = {
    name: NONE_INTENT,
    slot_definitions: [],
    utterances: await buildUtteranceBatch(noneUtterances, input.languageCode, tools),
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

const trainSlotTagger = async (input: TrainOutput, tools: Tools): Promise<Buffer> => {
  const hasSlots = _.flatMap(input.intents, i => i.slot_definitions).length > 0

  if (!hasSlots) {
    return Buffer.from('')
  }
  const crfExtractor = new CRFExtractor2(tools.mlToolkit)
  await crfExtractor.train(input.intents)

  return crfExtractor.serialized
}

const trainOOS = async (input: TrainOutput, tools: Tools): Promise<string | undefined> => {
  const points_a: sdk.MLToolkit.SVM.DataPoint[] = _.chain(input.intents)
    .filter(i => i.name !== 'none')
    .flatMap(i =>
      i.utterances.map(utt => {
        const posOH = encodeOH(
          POS_CLASSES,
          utt.tokens.map(t => t.POS)
        )

        // const tokensVerbs = utt.tokens.filter(x => ['NOUN', 'VERB'].includes(x.POS)).map(x => <number[]>x.vector)
        // if (!tokensVerbs.length) {
        //   tokensVerbs.push(new Array(utt.tokens[0].vector.length).fill(0))
        // }
        // const verbsEmbeddings = averageVectors(tokensVerbs)
        // const feats = [...utt.sentenceEmbedding, ...verbsEmbeddings]

        const averageByPOS = (...cls: string[]) => {
          const tokens = utt.tokens.filter(t => cls.includes(t.POS))
          const vectors = tokens.map(x => <number[]>x.vector)
          if (!vectors.length) {
            vectors.push(new Array(utt.tokens[0].vector.length).fill(0))
          }
          return averageVectors(vectors)
        }

        const pos1 = averageByPOS(...POS1_SET)
        const pos2 = averageByPOS(...POS2_SET)
        const pos3 = averageByPOS(...POS3_SET)
        const pos4 = averageByPOS(...POS4_SET)
        const feats = [...pos1, ...pos2, ...pos3, ...pos4]

        // const feats = [...posOH, ...kmeansOH, utt.tokens.length]
        // const feats = [...utt.sentenceEmbedding, ...posOH]

        // const feats = [...posOH, utt.tokens.length]
        // const feats = [...posOH]

        return { label: i.name, coordinates: feats }
      })
    )
    .value()

  const points_b: sdk.MLToolkit.SVM.DataPoint[] = _.chain(input.intents)
    .filter(i => i.name === 'none')
    .flatMap(i =>
      i.utterances.map(utt => {
        const posOH = encodeOH(
          POS_CLASSES,
          utt.tokens.map(t => t.POS)
        )

        const averageByPOS = (...cls: string[]) => {
          const tokens = utt.tokens.filter(t => cls.includes(t.POS))
          const vectors = tokens.map(x => <number[]>x.vector)
          if (!vectors.length) {
            vectors.push(new Array(utt.tokens[0].vector.length).fill(0))
          }
          return averageVectors(vectors)
        }

        const pos1 = averageByPOS(...POS1_SET)
        const pos2 = averageByPOS(...POS2_SET)
        const pos3 = averageByPOS(...POS3_SET)
        const pos4 = averageByPOS(...POS4_SET)
        const feats = [...pos1, ...pos2, ...pos3, ...pos4]

        return { label: 'out', coordinates: feats }
      })
    )
    .value()

  const svm = new tools.mlToolkit.SVM.Trainer()
  return svm.train([...points_a, ...points_b], {
    classifier: 'C_SVC',
    kernel: 'LINEAR'
    // c: [100, 10, 1, 0.5, 0.1, 0.01, 0.001],
    // gamma: [10, 1, 0.5, 0.1, 0.01, 0.001, 0.0001]
  })
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

  let progress = 0
  const reportProgress: progressCB = (stepProgress = 1) => {
    if (!input.trainingSession) {
      return
    }
    if (input.trainingSession.status === 'canceled') {
      tools.reportTrainingProgress(input.botId, 'Training canceled', input.trainingSession)
      throw new TrainingCanceledError()
    }
    progress = Math.floor(progress) + stepProgress
    const scaledProgress = Math.min(1, _.round(progress / NB_STEPS, 2))
    tools.reportTrainingProgress(input.botId, 'Training', { ...input.trainingSession, progress: scaledProgress })
  }
  try {
    let output = await preprocessInput(input, tools)
    output = await TfidfTokens(output)
    output = ClusterTokens(output, tools)
    output = await ExtractEntities(output, tools)
    output = await AppendNoneIntents(output, tools)
    const exact_match_index = buildExactMatchIndex(output)
    reportProgress()

    const oos_model = await trainOOS(output, tools)
    const ctx_model = await trainContextClassifier(output, tools, reportProgress)
    reportProgress()
    const intent_model_by_ctx = await trainIntentClassifier(output, tools, reportProgress)
    reportProgress()
    const slots_model = await trainSlotTagger(output, tools)
    reportProgress()

    const artefacts: TrainArtefacts = {
      list_entities: output.list_entities,
      // @ts-ignore
      oos_model,
      tfidf: output.tfIdf,
      ctx_model,
      intent_model_by_ctx,
      slots_model,
      vocabVectors: buildVectorsVocab(output.intents),
      exact_match_index
      // kmeans: {} add this when mlKmeans supports loading from serialized data,
    }
    reportProgress()

    _.merge(model, { success: true, data: { artefacts, output } })
  } catch (err) {
    if (err instanceof TrainingCanceledError) {
      debugTraining('Training aborted')
    } else {
      // TODO use bp.logger once this is moved in Engine2
      console.log('Could not finish training NLU model', err)
    }
    _.merge(model, { success: false })
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
