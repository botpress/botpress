import * as sdk from 'botpress/sdk'
import _, { cloneDeep } from 'lodash'
import math from 'mathjs'

import jaroDistance from './pipelines/entities/jaro'
import levenDistance from './pipelines/entities/levenshtein'
import tfidf from './pipelines/intents/tfidf'
import { appendToDebugFile } from './pipelines/intents/utils'
import { getClosestToken } from './pipelines/language/ft_featurizer'
import LanguageIdentifierProvider, { NA_LANG } from './pipelines/language/ft_lid'
import CRFExtractor2 from './pipelines/slots/crf-extractor2'
import { allInRange, computeNorm, GetZPercent, scalarDivide, vectorAdd } from './tools/math'
import { extractPattern } from './tools/patterns-utils'
import { replaceConsecutiveSpaces } from './tools/strings'
import { isSpace, isWord, SPACE } from './tools/token-utils'
import { EntityExtractor, Token2Vec } from './typings'
import { parseUtterance } from './utterance-parser'

// for intents, do we include predictionsReallyConfused (close) then none?

// ----- load models -----
//      run pre-training steps in pipeline
//      load everything from artefacts in predictors of PredictInput
//        load tfidf
//        load context model
//        load intent model
//        load kmeans
//        load crfModel
// ----- persist models -----
//      keep only serializable stuff in artefacts
// ----- benchmarks against e1 using bpds & f1 -----
// ----- partial cleanup -----
//      add value in utterance slots
//      extract kmeans in engine2 out of CRF
//      extract crf tagger in e2 with loading from binary
// ----- cancelation token -----

const NONE_INTENT = 'none'

export default class Engine2 {
  private tools: TrainTools

  provideTools = (tools: TrainTools) => {
    this.tools = tools
  }

  async train(input: StructuredTrainInput): Promise<Model> {
    const token: CancellationToken = {
      // TODO:
      cancel: async () => {},
      uid: '',
      isCancelled: () => false,
      cancelledAt: new Date()
    }

    // TODO load stateful models and keep them in memory to pass to predict pipeline
    return Trainer(input, this.tools, token)
  }
}

export type StructuredTrainInput = Readonly<{
  botId: string
  languageCode: string
  pattern_entities: PatternEntity[]
  list_entities: ListEntity[]
  contexts: string[]
  intents: Intent<string>[]
}>

export type StructuredTrainOutput = Readonly<{
  botId: string
  languageCode: string
  pattern_entities: PatternEntity[]
  list_entities: ListEntityModel[]
  contexts: string[]
  intents: Intent<Utterance>[]
  tfIdf: _.Dictionary<number>
}>

export type PatternEntity = Readonly<{
  name: string
  pattern: string
  examples: string[]
  ignoreCase: boolean
  sensitive: boolean
}>

export type ListEntity = Readonly<{
  name: string
  synonyms: { [canonical: string]: string[] }
  fuzzyMatching: boolean
  sensitive: boolean
}>

export type Intent<T> = Readonly<{
  name: string
  contexts: string[]
  slot_definitions: SlotDefinition[]
  utterances: T[]
  vocab: _.Dictionary<boolean>
  slot_entities: string[]
}>

export type SlotDefinition = Readonly<{
  name: string
  entities: string[]
}>

export type ListEntityModel = Readonly<{
  type: 'custom.list'
  id: string
  languageCode: string
  entityName: string
  fuzzyMatching: boolean
  sensitive: boolean
  /** @example { 'Air Canada': [ ['Air', '_Canada'], ['air', 'can'] ] } */
  mappingsTokens: _.Dictionary<string[][]>
}>

export type Utterance = Readonly<{
  toString(options?: UtteranceToStringOptions): string
  tagEntity(entity: ExtractedEntity, start: number, end: number)
  tagSlot(slot: ExtractedSlot, start: number, end: number)
  setGlobalTfidf(tfidf: _.Dictionary<number>)
  entities: ReadonlyArray<UtteranceRange & UtteranceEntity>
  slots: ReadonlyArray<UtteranceRange & UtteranceSlot>
  tokens: ReadonlyArray<UtteranceToken>
}>

export const prepareListEntityModels = async (entity: ListEntity, languageCode: string, tools: TrainTools) => {
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

export const takeUntil = (
  arr: ReadonlyArray<UtteranceToken>,
  start: number,
  desiredLength: number
): ReadonlyArray<UtteranceToken> => {
  let total = 0
  const result = _.takeWhile(arr.slice(start), t => {
    const toAdd = t.toString().length
    const current = total
    if (current > 0 && Math.abs(desiredLength - current) < Math.abs(desiredLength - current - toAdd)) {
      // better off as-is
      return false
    } else {
      // we're closed to desired if we add a new token
      total += toAdd
      return current < desiredLength
    }
  })
  if (result[result.length - 1].isSpace) {
    result.pop()
  }
  return result
}

export type EntityExtractionResult = ExtractedEntity & { start: number; end: number }
export const extractListEntities = (
  utterance: Utterance,
  list_entities: ListEntityModel[]
): EntityExtractionResult[] => {
  //
  const exactScore = (a: string[], b: string[]): number => {
    const str1 = a.join('')
    const str2 = b.join('')
    const min = Math.min(str1.length, str2.length)
    const max = Math.max(str1.length, str2.length)
    let score = 0
    for (let i = 0; i < min; i++) {
      if (str1[i] === str2[i]) {
        score++
      }
    }
    return score / max
  }
  //
  const fuzzyScore = (a: string[], b: string[]): number => {
    const str1 = a.join('')
    const str2 = b.join('')
    const d1 = levenDistance(str1, str2)
    const d2 = jaroDistance(str1, str2, { caseSensitive: false })
    return (d1 + d2) / 2
  }
  //
  const structuralScore = (a: string[], b: string[]): number => {
    const charset1 = _.uniq(_.flatten(a.map(x => x.split(''))))
    const charset2 = _.uniq(_.flatten(b.map(x => x.split(''))))
    const charset_score = _.intersection(charset1, charset2).length / _.union(charset1, charset2).length

    const la = Math.max(1, a.filter(x => x.length > 1).length)
    const lb = Math.max(1, a.filter(x => x.length > 1).length)
    const token_qty_score = Math.min(la, lb) / Math.max(la, lb)

    const size1 = _.sumBy(a, 'length')
    const size2 = _.sumBy(b, 'length')
    const token_size_score = Math.min(size1, size2) / Math.max(size1, size2)

    return Math.sqrt(charset_score * token_qty_score * token_size_score)
  }

  const matches: EntityExtractionResult[] = []

  for (const list of list_entities) {
    const candidates = []
    let longestCandidate = 0

    for (const [canonical, occurances] of _.toPairs(list.mappingsTokens)) {
      for (const occurance of occurances) {
        for (let i = 0; i < utterance.tokens.length; i++) {
          if (utterance.tokens[i].isSpace) {
            continue
          }
          const workset = takeUntil(utterance.tokens, i, _.sumBy(occurance, 'length'))
          const worksetAsStrings = workset.map(x => x.toString({ lowerCase: true, realSpaces: true, trim: false }))
          const candidateAsString = occurance.join('')

          if (candidateAsString.length > longestCandidate) {
            longestCandidate = candidateAsString.length
          }

          const fuzzy = list.fuzzyMatching && worksetAsStrings.join('').length >= 4
          const exact_score = exactScore(worksetAsStrings, occurance) === 1 ? 1 : 0
          const fuzzy_score = fuzzyScore(worksetAsStrings, occurance)
          const structural_score = structuralScore(worksetAsStrings, occurance)
          const finalScore = fuzzy ? fuzzy_score * structural_score : exact_score * structural_score

          candidates.push({
            score: Math.round(finalScore * 1000) / 1000,
            canonical,
            start: i,
            end: i + workset.length - 1,
            source: worksetAsStrings.join(''),
            occurance: occurance.join(''),
            eliminated: false
          })
        }
      }

      for (let i = 0; i < utterance.tokens.length; i++) {
        const results = _.orderBy(
          candidates.filter(x => !x.eliminated && x.start <= i && x.end >= i),
          // we want to favor longer matches (but is obviously less important than score)
          // so we take its length into account (up to the longest candidate)
          x => x.score * Math.pow(Math.min(x.source.length, longestCandidate), 1 / 5),
          'desc'
        )
        if (results.length > 1) {
          const [, ...losers] = results
          losers.forEach(x => (x.eliminated = true))
        }
      }
    }

    candidates
      .filter(x => !x.eliminated && x.score >= 0.6)
      .forEach(match => {
        matches.push({
          confidence: match.score,
          start: utterance.tokens[match.start].offset,
          end: utterance.tokens[match.end].offset + utterance.tokens[match.end].value.length,
          value: match.canonical,
          metadata: {
            source: match.source,
            occurance: match.occurance,
            entityId: list.id
          },
          type: list.entityName
        })
      })
  }

  return matches
}

// TODO test this
export const extractPatternEntities = (
  utterance: Utterance,
  pattern_entities: PatternEntity[]
): EntityExtractionResult[] => {
  const input = utterance.toString()
  // taken from pattern_extractor
  return _.flatMap(pattern_entities, ent => {
    const regex = new RegExp(ent.pattern!, 'i')

    return extractPattern(input, regex, []).map(res => ({
      confidence: 1,
      start: Math.max(0, res.sourceIndex),
      end: Math.min(input.length, res.sourceIndex + res.value.length),
      value: res.value,
      metadata: {
        source: res.value,
        entityId: `custom.pattern.${ent.name}`
      },
      type: ent.name
    }))
  })
}

export const extractSystemEntities = async (
  utterance: Utterance,
  languageCode: string,
  tools: TrainTools | PreditcTools
): Promise<EntityExtractionResult[]> => {
  const extracted = await tools.ducklingExtractor.extract(utterance.toString(), languageCode)
  return extracted.map(ent => ({
    confidence: ent.meta.confidence,
    start: ent.meta.start,
    end: ent.meta.end,
    value: ent.data.value,
    metadata: {
      source: ent.meta.source,
      entityId: `system.${ent.name}`,
      unit: ent.data.unit
    },
    type: ent.name
  }))
}

export class UtteranceClass implements Utterance {
  public slots: ReadonlyArray<UtteranceRange & UtteranceSlot> = []
  public entities: ReadonlyArray<UtteranceRange & UtteranceEntity> = []
  private _tokens: ReadonlyArray<UtteranceToken> = []
  private _globalTfidf?: _.Dictionary<number>

  setGlobalTfidf(tfidf: _.Dictionary<number>) {
    this._globalTfidf = tfidf
  }

  constructor(tokens: string[], vectors: number[][]) {
    if (tokens.length !== vectors.length) {
      throw Error('Tokens and vectors must match')
    }

    const arr = []
    for (let i = 0, offset = 0; i < tokens.length; i++) {
      const that = this
      const value = tokens[i]
      arr.push(
        Object.freeze({
          index: i,
          isBOS: i === 0,
          isEOS: i === tokens.length - 1,
          isWord: isWord(value),
          offset: offset,
          get slots(): ReadonlyArray<UtteranceRange & ExtractedSlot> {
            return that.slots.filter(x => x.startTokenIdx <= i && x.endTokenIdx >= i)
          },
          get entities(): ReadonlyArray<UtteranceRange & ExtractedEntity> {
            return that.entities.filter(x => x.startTokenIdx <= i && x.endTokenIdx >= i)
          },
          isSpace: isSpace(value),
          get tfidf(): number {
            return (that._globalTfidf && that._globalTfidf[value]) || 1
          },
          value: value,
          vectors: vectors[i],
          toString: (opts: TokenToStringOptions) => {
            const options = { ...DefaultTokenToStringOptions, ...opts }
            let result = value
            if (options.lowerCase) {
              result = result.toLowerCase()
            }
            if (options.realSpaces) {
              result = result.replace(new RegExp(SPACE, 'g'), ' ')
            }
            if (options.trim) {
              result = result.trim()
            }
            return result
          }
        })
      )
      offset += value.length
    }
    this._tokens = arr
  }

  get tokens(): ReadonlyArray<UtteranceToken> {
    return this._tokens
  }

  toString(options: UtteranceToStringOptions): string {
    options = _.defaultsDeep({}, options, { lowerCase: false, slots: 'keep-value' })

    let final = ''
    let ret = [...this.tokens]
    if (options.onlyWords) {
      ret = ret.filter(tok => tok.slots.length || tok.isWord)
    }

    for (const tok of ret) {
      let toAdd = ''
      if (!tok.slots.length && !tok.entities.length) {
        toAdd = tok.value
      }

      // case ignore is handled implicitely
      if (tok.slots.length && options.slots === 'keep-name') {
        toAdd = tok.slots[0].name
      } else if (tok.slots.length && options.slots === 'keep-value') {
        toAdd = tok.value
      } else if (tok.entities.length && options.entities === 'keep-name') {
        toAdd = tok.entities[0].type
      } else if (tok.entities.length && options.entities === 'keep-value') {
        toAdd = tok.entities[0].value.toString()
      } else if (tok.entities.length && options.entities === 'keep-default') {
        toAdd = tok.value
      }

      final += toAdd
    }

    if (options.lowerCase) {
      final = final.toLowerCase()
    }

    return final.replace(new RegExp(SPACE, 'g'), ' ')
  }

  clone(copyEntities: boolean, copySlots: boolean): UtteranceClass {
    const tokens = this.tokens.map(x => x.value)
    const vectors = this.tokens.map(x => <number[]>x.vectors)
    const utterance = new UtteranceClass(tokens, vectors)
    utterance.setGlobalTfidf({ ...this._globalTfidf })

    if (copyEntities) {
      this.entities.forEach(entity => utterance.tagEntity(entity, entity.startPos, entity.endPos))
    }

    if (copySlots) {
      this.slots.forEach(slot => utterance.tagSlot(slot, slot.startPos, slot.endPos))
    }

    return utterance
  }

  tagEntity(entity: ExtractedEntity, start: number, end: number) {
    const range = this.tokens.filter(x => x.offset >= start && x.offset + x.value.length <= end)
    this.entities = [
      ...this.entities,
      {
        ...entity,
        startPos: start,
        endPos: end,
        startTokenIdx: _.first(range).index,
        endTokenIdx: _.last(range).index
      }
    ]
  }

  tagSlot(slot: ExtractedSlot, start: number, end: number) {
    const range = this.tokens.filter(x => x.offset >= start && x.offset + x.value.length <= end)
    this.slots = [
      ...this.slots,
      {
        ...slot,
        startPos: start,
        endPos: end,
        startTokenIdx: _.first(range).index,
        endTokenIdx: _.last(range).index
      }
    ]
  }
}

export type UtteranceToStringOptions = {
  lowerCase: boolean
  onlyWords: boolean
  slots: 'keep-value' | 'keep-name' | 'ignore'
  entities: 'keep-default' | 'keep-value' | 'keep-name' | 'ignore'
}

export type TokenToStringOptions = {
  lowerCase?: boolean
  trim?: boolean
  realSpaces?: boolean
}

export type UtteranceRange = { startTokenIdx: number; endTokenIdx: number; startPos: number; endPos: number }
export type ExtractedEntity = { confidence: number; type: string; metadata: any; value: string }
export type ExtractedSlot = { confidence: number; name: string; source: any }
export type UtteranceEntity = Readonly<UtteranceRange & ExtractedEntity>
export type UtteranceSlot = Readonly<UtteranceRange & ExtractedSlot>
export type UtteranceToken = Readonly<{
  index: number
  value: string
  isWord: boolean
  isSpace: boolean
  isBOS: boolean
  isEOS: boolean
  vectors: ReadonlyArray<number>
  tfidf: number
  offset: number
  entities: ReadonlyArray<UtteranceRange & ExtractedEntity>
  slots: ReadonlyArray<UtteranceRange & ExtractedSlot>
  toString(options?: TokenToStringOptions): string
}>

export const DefaultTokenToStringOptions: TokenToStringOptions = { lowerCase: false, realSpaces: true, trim: false }

export interface Trainer {
  (input: StructuredTrainInput, tools: TrainTools, cancelToken: CancellationToken): Promise<Model>
}

// @ts-ignore
export const Trainer: Trainer = async (input, tools, cancelToken): Promise<Model> => {
  const startedAt = new Date()
  try {
    // TODO: Cancellation token effect
    input = cloneDeep(input)

    const list_entities = await Promise.map(input.list_entities, list =>
      prepareListEntityModels(list, input.languageCode, tools)
    )

    // TODO filter out non trainable intents (see engine 1 filtering conditions)
    const intents = await ProcessIntents(input.intents, input.languageCode, tools)

    let output = {
      ..._.omit(input, 'list_entities', 'intents'),
      list_entities,
      intents,
      tfIdf: {}
    }

    output = await ExtractEntities(output, tools)
    output = await TfidfTokens(output)
    output = await AppendNoneIntents(output, tools)

    const ctx_classifier = await trainContextClassifier(output, tools)
    const intent_classifier_per_ctx = await trainIntentClassifer(output, tools)

    const slot_tagger = await trainSlotTagger(output, tools)
    const finishedAt = new Date()

    // only serializable stuff in here
    const artefacts = {
      list_entities,
      tfidf: output.tfIdf,
      kmeans: {}, // TODO move kmeans out of crf extractor and pass it instead
      exact_classifier: {},
      ctx_classifier,
      intent_classifier_per_ctx,
      slot_tagger, // TODO this is not an artefact and should be the serialized version of CRF
      vocabVectors: vectorsVocab(output.intents) // TODO something better with this ? maybe build this as 1st step of predict pipeline
    }

    return {
      startedAt,
      finishedAt,
      inputData: input,
      languageCode: input.languageCode,
      outputData: output,
      artefacts,
      success: true
    }
  } catch (err) {
    return {
      startedAt,
      finishedAt: new Date(),
      success: false,
      inputData: input,
      languageCode: input.languageCode
    }
  }
}

// TODO test this (build intent vocab)
export const buildIntentVocab = (utterances: Utterance[]): _.Dictionary<boolean> => {
  return _.chain(utterances)
    .flatMap(u => u.tokens)
    .reduce((vocab: _.Dictionary<boolean>, tok) => ({ ...vocab, [tok.toString({ lowerCase: true })]: true }), {})
    .value()
}

const vectorsVocab = (intents: Intent<Utterance>[]): _.Dictionary<number[]> => {
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

// TODO vectorized implementation of this
// taken as is from ft_featurizer
// Taken from https://github.com/facebookresearch/fastText/blob/26bcbfc6b288396bd189691768b8c29086c0dab7/src/fasttext.cc#L486s
const computeSentenceEmbedding = (utterance: Utterance): number[] => {
  let totalWeight = 0
  let sentenceEmbedding = new Array(utterance.tokens[0].vectors.length).fill(0)

  for (const token of utterance.tokens) {
    const norm = computeNorm(token.vectors)
    if (norm <= 0) {
      continue
    }
    totalWeight += token.tfidf
    const weightedVec = scalarDivide(token.vectors as number[], norm / token.tfidf)
    sentenceEmbedding = vectorAdd(sentenceEmbedding, weightedVec)
  }

  return scalarDivide(sentenceEmbedding, totalWeight)
}

export const trainIntentClassifer = async (
  input: StructuredTrainOutput,
  tools: TrainTools
): Promise<_.Dictionary<string>> => {
  const svmPerCtx: _.Dictionary<string> = {}
  for (const ctx of input.contexts) {
    const points = _.chain(input.intents)
      .filter(i => i.contexts.includes(ctx))
      .flatMap(i =>
        i.utterances.map(utt => ({
          label: i.name,
          coordinates: computeSentenceEmbedding(utt)
        }))
      )
      .value()

    const svm = new tools.mlToolkit.SVM.Trainer({ kernel: 'LINEAR', classifier: 'C_SVC' })
    await svm.train(points, progress => {
      console.log('svm progress ==>', progress)
    }) // TODO progress & cancellation callback
    svmPerCtx[ctx] = svm.serialize()
  }

  return svmPerCtx
}

export const trainContextClassifier = async (input: StructuredTrainOutput, tools: TrainTools): Promise<string> => {
  const points = _.flatMapDeep(input.contexts, ctx => {
    return input.intents
      .filter(intent => intent.contexts.includes(ctx) && intent.name !== NONE_INTENT)
      .map(intent =>
        intent.utterances.map(utt => ({
          label: ctx,
          coordinates: computeSentenceEmbedding(utt)
        }))
      )
  })

  const svm = new tools.mlToolkit.SVM.Trainer({ kernel: 'LINEAR', classifier: 'C_SVC' })
  await svm.train(points, progress => console.log('SVM => progress for CTX %d', progress))

  return svm.serialize()
}

export const ProcessIntents = async (
  intents: Intent<string>[],
  languageCode: string,
  tools: TrainTools
): Promise<Intent<Utterance>[]> => {
  return Promise.map(intents, async intent => {
    const cleaned = intent.utterances.map(replaceConsecutiveSpaces)
    const utterances = await Utterances(cleaned, languageCode, tools)

    // make this a function ?
    // can should we use the vector map ?
    const vocab = buildIntentVocab(utterances)
    const slot_entities = _.chain(intent.slot_definitions)
      .flatMap(s => s.entities)
      .uniq()
      .value()

    return { ...intent, utterances: utterances, vocab, slot_entities }
  })
}

export const ExtractEntities = async (
  input: StructuredTrainOutput,
  tools: TrainTools
): Promise<StructuredTrainOutput> => {
  for (const intent of input.intents) {
    intent.utterances.forEach(async utterance => await extractUtteranceEntities(utterance, input, tools))
  }

  return input
}

const extractUtteranceEntities = async (
  utterance: Utterance,
  input: StructuredTrainOutput | PredictStepOutput,
  tools: TrainTools | PreditcTools
) => {
  const extractedEntities = [
    ...extractListEntities(utterance, input.list_entities),
    ...extractPatternEntities(utterance, input.pattern_entities),
    ...(await extractSystemEntities(utterance, input.languageCode, tools))
  ] as EntityExtractionResult[]

  extractedEntities.forEach(entityRes => {
    utterance.tagEntity(_.omit(entityRes, ['start, end']), entityRes.start, entityRes.end)
  })
}

export const AppendNoneIntents = async (
  input: StructuredTrainOutput,
  tools: TrainTools
): Promise<StructuredTrainOutput> => {
  const allUtterances = _.flatten(input.intents.map(x => x.utterances))

  const vocabulary = _.chain(allUtterances)
    .map(x => x.tokens.map(x => x.value))
    .flattenDeep<string>()
    .uniq()
    .value()

  const junkWords = await tools.generateSimilarJunkWords(vocabulary)
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

export const TfidfTokens = async (input: StructuredTrainOutput): Promise<StructuredTrainOutput> => {
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

const Utterances = async (
  raw_utterances: string[],
  languageCode: string,
  tools: TrainTools | PreditcTools
): Promise<Utterance[]> => {
  const parsed = raw_utterances.map(u => parseUtterance(replaceConsecutiveSpaces(u)))
  const tokens = await tools.tokenize_utterances(parsed.map(p => p.utterance), languageCode)
  const uniqTokens = _.uniq(_.flatten(tokens))
  const vectors = await tools.vectorize_tokens(uniqTokens, languageCode)
  const vectorMap = _.zipObject(uniqTokens, vectors)

  return _.zip(tokens, parsed).map(([tokUtt, { parsedSlots }]) => {
    const vectors = tokUtt.map(t => vectorMap[t])
    const utterance = new UtteranceClass(tokUtt, vectors)
    parsedSlots.forEach(s => {
      utterance.tagSlot({ name: s.name, source: s.value, confidence: 1 }, s.cleanPosition.start, s.cleanPosition.end)
    })

    return utterance
  })
}

const trainSlotTagger = async (input: StructuredTrainOutput, tools: TrainTools): Promise<CRFExtractor2> => {
  const crfExtractor = new CRFExtractor2(tools.mlToolkit)
  await crfExtractor.train(input.intents)

  return crfExtractor
}

export interface TrainArtefacts {
  list_entities: ListEntityModel[]
  tfidf: _.Dictionary<number>
  vocabVectors: Token2Vec
  kmeans: any // TODO fix this
  context_ranking: any // TODO fix this
  exact_classifier: any // TODO fix this
  intent_classifier: any // TODO fix this
  slot_tagger: CRFExtractor2
}

export interface CancellationToken {
  readonly uid: string
  isCancelled(): boolean
  cancelledAt: Date
  cancel(): Promise<void>
}

export interface TrainTools {
  tokenize_utterances(utterances: string[], languageCode: string): Promise<string[][]>
  vectorize_tokens(tokens: string[], languageCode: string): Promise<number[][]>
  generateSimilarJunkWords(vocabulary: string[]): Promise<string[]>
  ducklingExtractor: EntityExtractor
  mlToolkit: typeof sdk.MLToolkit
}

export type PreditcTools = Omit<TrainTools, 'generateSimilarJunkWords'>

export interface Model {
  languageCode: string
  inputData: StructuredTrainInput
  outputData?: StructuredTrainOutput
  startedAt: Date
  finishedAt: Date
  success: boolean
  artefacts?: TrainArtefacts
}

// TODO include loaded models / predictors
export interface PredictInput {
  defaultLanguage: string
  supportedLanguages: string[]
  includedContexts: string[]
  sentence: string
  models: _.Dictionary<Model>
}

type E1IntentPred = {
  name: string
  context: string
  confidence: number
} // only to comply with engine 1

export interface PredictStepOutput {
  readonly rawText: string
  includedContexts: string[]
  detectedLanguage: string
  languageCode: string
  utterance?: Utterance
  pattern_entities: PatternEntity[] // use this from model ?
  list_entities: ListEntityModel[] // use this from model ?
  model: Model
  ctx_predictions?: sdk.MLToolkit.SVM.Prediction[]
  intent_preds?: {
    // TODO rename for intent_predictions
    per_ctx: _.Dictionary<sdk.MLToolkit.SVM.Prediction[]>
    combined: E1IntentPred[] // only to comply with E1
    elected: E1IntentPred // only to comply with E1
    ambiguous?: boolean
  }
  // intent_predictions_per_ctx?: _.Dictionary<sdk.MLToolkit.SVM.Prediction[]>
  // intent_predictions?: E1IntentPred[]
  // elected_intent?: E1IntentPred
  // ambiguous?: boolean
  // TODO slots predictions per intent
}

const predict = {
  DetectLanguage: async (input: PredictInput, tools: PreditcTools): Promise<PredictStepOutput> => {
    const langIdentifier = LanguageIdentifierProvider.getLanguageIdentifier(tools.mlToolkit)
    const lidRes = await langIdentifier.identify(input.sentence)
    const elected = lidRes.filter(pred => input.supportedLanguages.includes(pred.label))[0]

    // because with single-worded sentences, confidence is always very low
    // we assume that a input of 20 chars is more than a single word
    const threshold = input.sentence.length > 20 ? 0.5 : 0.3

    let detectedLanguage = _.get(elected, 'label', NA_LANG)
    if (detectedLanguage !== NA_LANG && !input.supportedLanguages.includes(detectedLanguage)) {
      detectedLanguage = NA_LANG
    }

    const languageCode =
      detectedLanguage !== NA_LANG && elected.value > threshold ? detectedLanguage : input.defaultLanguage

    const model = input.models[languageCode]

    return {
      ..._.pick(input, 'includedContexts'),
      list_entities: model.artefacts.list_entities,
      pattern_entities: model.inputData.pattern_entities,
      rawText: input.sentence,
      detectedLanguage,
      languageCode,
      model
    }
  },
  PredictionUtterance: async (input: PredictStepOutput, tools: PreditcTools): Promise<PredictStepOutput> => {
    const [utterance] = await Utterances([input.rawText], input.languageCode, tools)

    const { tfidf, vocabVectors } = input.model.artefacts
    utterance.tokens.forEach(token => {
      const t = token.toString({ lowerCase: true })
      if (!tfidf[t]) {
        const closestToken = getClosestToken(t, <number[]>token.vectors, vocabVectors)
        tfidf[t] = tfidf[closestToken]
      }
    })

    utterance.setGlobalTfidf(tfidf)

    return {
      ...input,
      utterance
    }
  },
  ExtractEntities: async (input: PredictStepOutput, tools: PreditcTools): Promise<PredictStepOutput> => {
    await extractUtteranceEntities(input.utterance!, input, tools)
    return {
      ...input
    }
  },
  PredictContext: async (input: PredictStepOutput, tools: PreditcTools): Promise<PredictStepOutput> => {
    const predictor = new tools.mlToolkit.SVM.Predictor(input.model.artefacts.ctx_classifier)
    const features = computeSentenceEmbedding(input.utterance)
    const predictions = await predictor.predict(features)

    return {
      ...input,
      ctx_predictions: predictions
    }
  },
  PredictIntent: async (input: PredictStepOutput, tools: PreditcTools) => {
    const ctxToPredict = input.ctx_predictions.map(p => p.label)

    // build this on load
    // use what's it in tools / input / predictors
    const stringOptions: UtteranceToStringOptions = {
      lowerCase: true,
      onlyWords: true,
      slots: 'ignore',
      entities: 'ignore'
    }
    const exactMatchIndex = _.chain(input.model.outputData.intents)
      .flatMap(i =>
        i.utterances.map(u => ({
          utterance: u.toString(stringOptions),
          contexts: i.contexts,
          intent: i.name
        }))
      )
      .reduce(
        (index, { utterance, contexts, intent }) => ({ ...index, [utterance]: { intent, contexts } }),
        {} as _.Dictionary<{ intent: string; contexts: string[] }> // TODO extract typing
      )
      .value()

    // TODO refine this and add some levinstein magic in there
    const exactMatch = exactMatchIndex[input.utterance.toString(stringOptions)]
    const predictions = await Promise.map(ctxToPredict, async ctx => {
      // todo use predictor from input when implemented
      const intentModel = input.model.artefacts.intent_classifier_per_ctx[ctx]
      if (!intentModel) {
        return
      }

      const predictor = new tools.mlToolkit.SVM.Predictor(intentModel)
      const features = computeSentenceEmbedding(input.utterance)
      const preds = await predictor.predict(features)
      // TODO extract this in a func predictExact(utterance, ctx) return exact pred
      if (_.get(exactMatch, 'contexts', []).includes(ctx)) {
        preds.unshift({ label: exactMatch.intent, confidence: 1 })
      }

      return preds
    })

    return {
      ...input,
      intent_predictions_per_ctx: _.zipObject(ctxToPredict, predictions)
    }
  },
  // TODO implement this algorithm properly / improve it currently taken as is from svm classifier
  ElectIntent: (input: PredictStepOutput) => {
    appendToDebugFile('l1preds-ennine2.json', _.toPairs(input.intent_preds.per_ctx))
    // taken from predictL0Contextually
    const includedCtxPreds = input.ctx_predictions.filter(pred => input.includedContexts.includes(pred.label)) // TODO remove this hard filter from included contexts
    const totalConfidence = Math.min(1, _.sumBy(includedCtxPreds, 'confidence'))
    const ctxPreds = includedCtxPreds.map(x => ({ ...x, confidence: x.confidence / totalConfidence }))
    appendToDebugFile('l0pred-engine2.json', ctxPreds) // TODO remove this

    // taken from svm classifier #349
    const predictions = _.chain(ctxPreds)
      .flatMap(({ label: ctx, confidence: ctxConf }) => {
        const intentPreds = _.orderBy(input.intent_preds.per_ctx[ctx], 'confidence', 'desc')
        if (intentPreds.length === 1) {
          return [{ label: intentPreds[0].label, l0Confidence: ctxConf, context: ctx, confidence: 1 }]
        }

        const lnstd = math.std(intentPreds.map(x => Math.log(x.confidence))) // because we want a lognormal distribution
        let p1Conf = GetZPercent((Math.log(intentPreds[0].confidence) - Math.log(intentPreds[1].confidence)) / lnstd)
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
      .map(p => ({ name: p.label, context: p.context, confidence: p.confidence }))
      .value()

    appendToDebugFile('final-ennine2.json', predictions)
    return _.merge(_.cloneDeep(input), {
      intentPreds: { combined: predictions, elected: _.maxBy(predictions, 'confidence') }
    })
  },
  AmbiguityDetection: (input: PredictStepOutput) => {
    // +- 10% away from perfect median leads to ambiguity
    const preds = input.intent_preds.combined
    const perfectConfusion = 1 / preds.length
    const low = perfectConfusion - 0.1
    const up = perfectConfusion + 0.1
    const confidenceVec = preds.map(p => p.confidence)

    const ambiguous = preds.length > 1 && allInRange(confidenceVec, low, up)

    return _.merge(_.cloneDeep(input), { intentPreds: { ambiguous } })
  },
  ExtractSlots: async (input: PredictStepOutput) => {
    // TODO use loaded model, what's in artefact as this should only be serializable stuff
    const intent =
      !input.intent_preds.ambiguous &&
      input.model.outputData.intents.find(i => i.name === input.intent_preds.elected.name)
    if (intent && intent.slot_definitions.length > 0) {
      // TODO try to extract for each intent predictions and then rank this in the election step
      const slots = await input.model.artefacts.slot_tagger.extract(input.utterance!, intent)
      slots.forEach(({ slot, start, end }) => {
        input.utterance.tagSlot(slot, start, end)
      })
    }

    return input
  }
}

type PredictOutput = sdk.IO.EventUnderstanding // temporary fully compliant with engine1
function MapStepToOutput(step: PredictStepOutput, startTime: number): PredictOutput {
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

  const slots = step.utterance.slots.reduce(
    (slots, s) => {
      return {
        ...slots,
        [s.name]: {
          confidence: s.confidence,
          name: s.name,
          source: s.source,
          value: s.source // TODO replace by value
          // add entity ?
        } as sdk.NLU.Slot
      }
    },
    {} as sdk.NLU.SlotCollection
  )
  return {
    ambiguous: step.intent_preds.ambiguous,
    detectedLanguage: step.detectedLanguage,
    entities,
    errored: false,
    includedContexts: step.includedContexts,
    intent: step.intent_preds.elected,
    intents: step.intent_preds.combined,
    language: step.languageCode,
    slots,
    ms: Date.now() - startTime
  }
}

export const Predict = async (input: PredictInput, tools: PreditcTools): Promise<PredictOutput> => {
  const t0 = Date.now()
  let stepOutput = await predict.DetectLanguage(input, tools)
  stepOutput = await predict.PredictionUtterance(stepOutput, tools)
  stepOutput = await predict.ExtractEntities(stepOutput, tools)
  stepOutput = await predict.PredictContext(stepOutput, tools)
  stepOutput = await predict.PredictIntent(stepOutput, tools)
  stepOutput = predict.ElectIntent(stepOutput)
  stepOutput = predict.AmbiguityDetection(stepOutput)
  stepOutput = await predict.ExtractSlots(stepOutput)
  // todo map predictStep (output) to e1 output and return
  return MapStepToOutput(stepOutput, t0)
}
