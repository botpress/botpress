import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import tfidf from '../pipelines/intents/tfidf'
import { replaceConsecutiveSpaces } from '../tools/strings'
import { SPACE } from '../tools/token-utils'
import { parseUtterance } from '../tools/utterance-parser'
import { Token2Vec } from '../typings'

import CRFExtractor2 from './crf-extractor2'
import { extractUtteranceEntities, ListEntity, ListEntityModel, PatternEntity, TFIDF, Tools } from './engine2'
import { Model } from './model-service'
import Utterance, { UtteranceToken, UtteranceToStringOptions } from './utterance'

// TODO make this return artefacts only and move the make model login in E2
export type Trainer = (input: TrainInput, tools: Tools, cancelToken: CancellationToken) => Promise<Model>

export type TrainInput = Readonly<{
  languageCode: string
  pattern_entities: PatternEntity[]
  list_entities: ListEntity[]
  contexts: string[]
  intents: Intent<string>[]
}>

export type TrainOutput = Readonly<{
  languageCode: string
  pattern_entities: PatternEntity[]
  list_entities: ListEntityModel[]
  contexts: string[]
  intents: Intent<Utterance>[]
  tfIdf?: TFIDF
  kmeans?: sdk.MLToolkit.KMeans.KmeansResult
}>

export interface CancellationToken {
  readonly uid: string
  isCancelled(): boolean
  cancelledAt: Date
  cancel(): Promise<void>
}

export interface TrainArtefacts {
  list_entities: ListEntityModel[]
  tfidf: TFIDF
  vocabVectors: Token2Vec
  // kmeans: KmeansResult
  ctx_model: string
  intent_model_by_ctx: _.Dictionary<string>
  slots_model: Buffer
  exact_match_index: ExactMatchIndex
}

export type Intent<T> = Readonly<{
  name: string
  contexts: string[]
  slot_definitions: SlotDefinition[]
  utterances: T[]
  vocab?: _.Dictionary<boolean>
  slot_entities?: string[]
}>

export type ExactMatchIndex = _.Dictionary<{ intent: string; contexts: string[] }>

type SlotDefinition = Readonly<{
  name: string
  entities: string[]
}>

const debugIntents = DEBUG('nlu').sub('intents')
const debugIntentsTrain = debugIntents.sub('train')
const NONE_INTENT = 'none'
export const EXACT_MATCH_STR_OPTIONS: UtteranceToStringOptions = {
  lowerCase: true,
  onlyWords: true,
  slots: 'ignore',
  entities: 'ignore'
}
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
    fuzzyMatching: entity.fuzzyMatching,
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
    .map((t: UtteranceToken) => t.vectors)
    .value() as number[][]

  if (_.isEmpty(data)) {
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
      (vocab, tok: UtteranceToken) => ({ ...vocab, [tok.toString({ lowerCase: true })]: tok.vectors }),
      {} as Token2Vec
    )
    .value()
}

const buildExactMatchIndex = (input: TrainOutput): ExactMatchIndex => {
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

const trainIntentClassifer = async (input: TrainOutput, tools: Tools): Promise<_.Dictionary<string> | undefined> => {
  if (input.intents.length === 0) {
    return
  }
  const svmPerCtx: _.Dictionary<string> = {}
  for (const ctx of input.contexts) {
    const points = _.chain(input.intents)
      .filter(i => i.contexts.includes(ctx))
      .flatMap(i =>
        i.utterances.map(utt => ({
          label: i.name,
          coordinates: utt.sentenceEmbedding
        }))
      )
      .value()

    const svm = new tools.mlToolkit.SVM.Trainer()
    svmPerCtx[ctx] = await svm.train(points, SVM_OPTIONS, p => debugIntentsTrain('svm progress ==> %d', p))
  }

  return svmPerCtx
}

const trainContextClassifier = async (input: TrainOutput, tools: Tools): Promise<string | undefined> => {
  if (input.intents.length === 0) {
    return
  }

  const points = _.flatMapDeep(input.contexts, ctx => {
    return input.intents
      .filter(intent => intent.contexts.includes(ctx) && intent.name !== NONE_INTENT)
      .map(intent =>
        intent.utterances.map(utt => ({
          label: ctx,
          coordinates: utt.sentenceEmbedding
        }))
      )
  })

  const svm = new tools.mlToolkit.SVM.Trainer()
  return svm.train(points, SVM_OPTIONS, p => debugIntentsTrain('SVM => progress for CTX %d', p))
}

export const ProcessIntents = async (
  intents: Intent<string>[],
  languageCode: string,
  list_entities: ListEntityModel[],
  tools: Tools
): Promise<Intent<Utterance>[]> => {
  return Promise.map(intents, async intent => {
    // TODO filter out non trainable intents (see engine 1 filtering conditions)
    const cleaned = intent.utterances.map(replaceConsecutiveSpaces)
    const utterances = await Utterances(cleaned, languageCode, tools)

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
  const copy = { ...input }

  for (const intent of copy.intents) {
    intent.utterances.forEach(async utterance => await extractUtteranceEntities(utterance, input, tools))
  }

  return copy
}

export const AppendNoneIntents = async (input: TrainOutput, tools: Tools): Promise<TrainOutput> => {
  if (input.intents.length === 0) {
    return input
  }

  const allUtterances = _.flatten(input.intents.map(x => x.utterances))
  const vocabulary = _.chain(allUtterances)
    .map(x => x.tokens.map(x => x.value))
    .flattenDeep<string>()
    .uniq()
    .value()

  const junkWords = await tools.generateSimilarJunkWords(vocabulary, input.languageCode)
  const avgUtterances = _.meanBy(input.intents, x => x.utterances.length)
  const avgTokens = _.meanBy(allUtterances, x => x.tokens.length)
  const nbOfNoneUtterances = Math.max(5, avgUtterances)

  // If 50% of words start with a space, we know this language is probably space-separated, and so we'll join tokens using spaces
  const joinChar = vocabulary.filter(x => x.startsWith(SPACE)).length >= vocabulary.length * 0.5 ? SPACE : ''

  const noneUtterances = _.range(0, nbOfNoneUtterances).map(() => {
    const nbWords = _.random(avgTokens / 2, avgTokens * 2, false)
    return _.sampleSize(junkWords, nbWords).join(joinChar)
  })

  const intent: Intent<Utterance> = {
    name: NONE_INTENT,
    slot_definitions: [],
    utterances: await Utterances(noneUtterances, input.languageCode, tools),
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

// Move this to utterances (make utterances)
export const Utterances = async (
  raw_utterances: string[],
  languageCode: string,
  tools: Tools
): Promise<Utterance[]> => {
  const parsed = raw_utterances.map(u => parseUtterance(replaceConsecutiveSpaces(u)))
  const tokens = await tools.tokenize_utterances(parsed.map(p => p.utterance), languageCode)
  const uniqTokens = _.uniq(_.flatten(tokens))
  const vectors = await tools.vectorize_tokens(uniqTokens, languageCode)
  const vectorMap = _.zipObject(uniqTokens, vectors)

  return _.zip(tokens, parsed).map(([tokUtt, { utterance: utt, parsedSlots }]) => {
    const vectors = tokUtt.map(t => vectorMap[t])
    const utterance = new Utterance(tokUtt, vectors)

    // TODO: temporary work-around
    // covers a corner case where tokenization returns tokens that are not identical to `parsed` utterance
    // the corner case is when there's a trailing space inside a slot at the end of the utterance, e.g. `my name is [Sylvain ](any)`
    if (utterance.toString().length === utt.length) {
      parsedSlots.forEach(s => {
        utterance.tagSlot({ name: s.name, source: s.value, confidence: 1 }, s.cleanPosition.start, s.cleanPosition.end)
      })
    } // else we skip the slot

    return utterance
  })
}

const trainSlotTagger = async (input: TrainOutput, tools: Tools): Promise<Buffer> => {
  if (input.intents.length === 0) {
    return Buffer.from('')
  }
  const crfExtractor = new CRFExtractor2(tools.mlToolkit)
  await crfExtractor.train(input.intents)

  return crfExtractor.serialized
}

export const Trainer: Trainer = async (
  input: TrainInput,
  tools: Tools,
  cancelToken: CancellationToken
): Promise<Model> => {
  const model: Partial<Model> = {
    startedAt: new Date(),
    languageCode: input.languageCode,
    data: {
      input
    }
  }

  try {
    // TODO: Cancellation token effect

    let output = await preprocessInput(input, tools)
    output = await TfidfTokens(output)
    output = ClusterTokens(output, tools)
    output = await ExtractEntities(output, tools)
    output = await AppendNoneIntents(output, tools)

    const exact_match_index = buildExactMatchIndex(output)
    const ctx_model = await trainContextClassifier(output, tools)
    const intent_model_by_ctx = await trainIntentClassifer(output, tools)
    const slots_model = await trainSlotTagger(output, tools)

    const artefacts: TrainArtefacts = {
      list_entities: output.list_entities,
      tfidf: output.tfIdf,
      ctx_model,
      intent_model_by_ctx,
      slots_model,
      vocabVectors: buildVectorsVocab(output.intents),
      exact_match_index
      // kmeans: {} add this when mlKmeans supports loading from serialized data,
    }

    _.merge(model, { success: true, data: { artefacts, output } })
  } catch (err) {
    console.log('could not train nlu model', err)
    _.merge(model, { success: false })
  } finally {
    model.finishedAt = new Date()
    return model as Model
  }
}
