import * as sdk from 'botpress/sdk'
import _, { cloneDeep } from 'lodash'
import math from 'mathjs'

import tfidf from '../pipelines/intents/tfidf'
import { getClosestToken } from '../pipelines/language/ft_featurizer'
import LanguageIdentifierProvider, { NA_LANG } from '../pipelines/language/ft_lid'
import jaroDistance from '../tools/jaro'
import levenDistance from '../tools/levenshtein'
import { allInRange, computeNorm, GetZPercent, scalarDivide, vectorAdd } from '../tools/math'
import { extractPattern } from '../tools/patterns-utils'
import { replaceConsecutiveSpaces } from '../tools/strings'
import { isSpace, isWord, SPACE } from '../tools/token-utils'
import { parseUtterance } from '../tools/utterance-parser'
import { EntityExtractor, Token2Vec } from '../typings'

import CRFExtractor2 from './crf-extractor2'

const debugIntents = DEBUG('nlu').sub('intents')
const debugIntentsTrain = debugIntents.sub('train')
const SVM_OPTIONS = { kernel: 'LINEAR', classifier: 'C_SVC' } as sdk.MLToolkit.SVM.SVMOptions
// TODO grid search / optimization for those hyperparams
const NUM_CLUSTERS = 8
const KMEANS_OPTIONS = {
  iterations: 250,
  initialization: 'random',
  seed: 666 // so training is consistent
} as sdk.MLToolkit.KMeans.KMeansOptions

// ----- simple improvements -----
//       add value in utterance slots
//       completely get rid of engine1
//       split e2 in different files (modules)

const NONE_INTENT = 'none'
const DEFAULT_CTX = 'global'
const EXACT_MATCH_STR_OPTIONS: UtteranceToStringOptions = {
  lowerCase: true,
  onlyWords: true,
  slots: 'ignore',
  entities: 'ignore'
}

type TFIDF = _.Dictionary<number>

interface Predictors {
  ctx_classifer: sdk.MLToolkit.SVM.Predictor
  intent_classifier_per_ctx: _.Dictionary<sdk.MLToolkit.SVM.Predictor>
  kmeans: sdk.MLToolkit.KMeans.KmeansResult
  slot_tagger: CRFExtractor2 // TODO replace this by MlToolkit.CRF.Tagger
}

export type E2ByBot = _.Dictionary<Engine2>

export default class Engine2 {
  private static tools: Tools
  private predictorsByLang: _.Dictionary<Predictors> = {}
  private modelsByLang: _.Dictionary<Model> = {}

  constructor(private defaultLanguage: string) {}

  static provideTools(tools: Tools) {
    Engine2.tools = tools
  }

  async train(input: TrainInput): Promise<Model> {
    const token: CancellationToken = {
      cancel: async () => {},
      uid: '',
      isCancelled: () => false,
      cancelledAt: new Date()
    }

    const model = await Trainer(input, Engine2.tools, token)
    // TODO handle this logic outside. i.e (distributed)job-service ?
    if (model.success) {
      await this.loadModel(model)
    }
    return model
  }

  async loadModels(models: Model[]) {
    return Promise.map(models, model => this.loadModel(model))
  }

  async loadModel(model: Model) {
    if (
      _.isEqual(this.modelsByLang[model.languageCode], model) &&
      this.predictorsByLang[model.languageCode] !== undefined
    ) {
      return
    }

    this.predictorsByLang[model.languageCode] = await this._makePredictors(model)
    this.modelsByLang[model.languageCode] = model
  }

  private async _makePredictors(model: Model): Promise<Predictors> {
    const { input, output, artefacts } = model.data
    const tools = Engine2.tools

    if (input.intents.length > 0) {
      const ctx_classifer = new tools.mlToolkit.SVM.Predictor(artefacts.ctx_model)
      const intent_classifier_per_ctx = _.toPairs(artefacts.intent_model_by_ctx).reduce(
        (c, [ctx, intentModel]) => ({ ...c, [ctx]: new tools.mlToolkit.SVM.Predictor(intentModel as string) }),
        {} as _.Dictionary<sdk.MLToolkit.SVM.Predictor>
      )
      const slot_tagger = new CRFExtractor2(tools.mlToolkit) // TODO change this for MLToolkit.CRF.Tagger
      slot_tagger.load(artefacts.slots_model)

      const processedIntents = output
        ? output.intents
        : await ProcessIntents(input.intents, model.languageCode, artefacts.list_entities, tools)
      const kmeans = computeKmeans(processedIntents, tools) // TODO load from artefacts when persistd

      return { ctx_classifer, intent_classifier_per_ctx, slot_tagger, kmeans }
    } else {
      // we don't want to return undefined as extraction won't be triggered
      // we want to make it possible to extract entities without having any intents
      return {} as Predictors
    }
  }

  async predict(sentence: string, includedContexts: string[]): Promise<PredictOutput> {
    const input: PredictInput = {
      defaultLanguage: this.defaultLanguage,
      sentence,
      includedContexts
    }
    return Predict(input, Engine2.tools, this.modelsByLang, this.predictorsByLang)
  }
}

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
  vocab?: _.Dictionary<boolean>
  slot_entities?: string[]
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

export const makeListEntityModel = async (entity: ListEntity, languageCode: string, tools: Tools) => {
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
    const charsetLow1 = charset1.map(c => c.toLowerCase())
    const charsetLow2 = charset2.map(c => c.toLowerCase())
    const charset_low_score = _.intersection(charsetLow1, charsetLow2).length / _.union(charsetLow1, charsetLow2).length
    const final_charset_score = _.mean([charset_score, charset_low_score])

    const la = Math.max(1, a.filter(x => x.length > 1).length)
    const lb = Math.max(1, a.filter(x => x.length > 1).length)
    const token_qty_score = Math.min(la, lb) / Math.max(la, lb)

    const size1 = _.sumBy(a, 'length')
    const size2 = _.sumBy(b, 'length')
    const token_size_score = Math.min(size1, size2) / Math.max(size1, size2)

    return Math.sqrt(final_charset_score * token_qty_score * token_size_score)
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
            source: workset.map(t => t.toString({ lowerCase: false, realSpaces: true })).join(''),
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
      .filter(x => !x.eliminated && x.score >= 0.65)
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
  tools: Tools
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

export class Utterance {
  public slots: ReadonlyArray<UtteranceRange & UtteranceSlot> = []
  public entities: ReadonlyArray<UtteranceRange & UtteranceEntity> = []
  private _tokens: ReadonlyArray<UtteranceToken> = []
  private _globalTfidf?: TFIDF
  private _kmeans?: sdk.MLToolkit.KMeans.KmeansResult

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
          isSpace: isSpace(value),
          get slots(): ReadonlyArray<UtteranceRange & ExtractedSlot> {
            return that.slots.filter(x => x.startTokenIdx <= i && x.endTokenIdx >= i)
          },
          get entities(): ReadonlyArray<UtteranceRange & ExtractedEntity> {
            return that.entities.filter(x => x.startTokenIdx <= i && x.endTokenIdx >= i)
          },
          get tfidf(): number {
            return (that._globalTfidf && that._globalTfidf[value]) || 1
          },
          get cluster(): number {
            const wordVec = vectors[i]
            return (that._kmeans && that._kmeans.nearest([wordVec])[0]) || 1
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
        } as UtteranceToken)
      )
      offset += value.length
    }
    this._tokens = arr
  }

  get tokens(): ReadonlyArray<UtteranceToken> {
    return this._tokens
  }

  setGlobalTfidf(tfidf: TFIDF) {
    this._globalTfidf = tfidf
  }

  setKmeans(kmeans: sdk.MLToolkit.KMeans.KmeansResult) {
    this._kmeans = kmeans
  }

  // TODO memoize this for better perf
  toString(options?: UtteranceToStringOptions): string {
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

  clone(copyEntities: boolean, copySlots: boolean): Utterance {
    const tokens = this.tokens.map(x => x.value)
    const vectors = this.tokens.map(x => <number[]>x.vectors)
    const utterance = new Utterance(tokens, vectors)
    utterance.setGlobalTfidf({ ...this._globalTfidf })

    if (copyEntities) {
      this.entities.forEach(entity => utterance.tagEntity(entity, entity.startPos, entity.endPos))
    }

    if (copySlots) {
      this.slots.forEach(slot => utterance.tagSlot(slot, slot.startPos, slot.endPos))
    }

    return utterance
  }

  private _validateRange(start: number, end: number) {
    const lastTok = _.last(this._tokens)
    const maxEnd = _.get(lastTok, 'offset', 0) + _.get(lastTok, 'value.length', 0)

    if (start < 0 || start > end || start > maxEnd || end > maxEnd) {
      throw new Error('Invalid range')
    }
  }

  tagEntity(entity: ExtractedEntity, start: number, end: number) {
    this._validateRange(start, end)
    const range = this.tokens.filter(x => x.offset >= start && x.offset + x.value.length <= end)
    if (_.isEmpty(range)) {
      return
    }
    const entityWithPos = {
      ...entity,
      startPos: start,
      endPos: end,
      startTokenIdx: _.first(range).index,
      endTokenIdx: _.last(range).index
    }

    this.entities = [...this.entities, entityWithPos]
  }

  tagSlot(slot: ExtractedSlot, start: number, end: number) {
    this._validateRange(start, end)
    const range = this.tokens.filter(x => x.offset >= start && x.offset + x.value.length <= end)
    if (_.isEmpty(range)) {
      return
    }

    const taggedSlot = {
      ...slot,
      startPos: start,
      endPos: end,
      startTokenIdx: _.first(range).index,
      endTokenIdx: _.last(range).index
    }

    this.slots = [...this.slots, taggedSlot]
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
  cluster: number
  offset: number
  entities: ReadonlyArray<UtteranceRange & ExtractedEntity>
  slots: ReadonlyArray<UtteranceRange & ExtractedSlot>
  toString(options?: TokenToStringOptions): string
}>

export const DefaultTokenToStringOptions: TokenToStringOptions = { lowerCase: false, realSpaces: true, trim: false }

export type Trainer = (input: TrainInput, tools: Tools, cancelToken: CancellationToken) => Promise<Model>

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

export interface CancellationToken {
  readonly uid: string
  isCancelled(): boolean
  cancelledAt: Date
  cancel(): Promise<void>
}

export interface Tools {
  tokenize_utterances(utterances: string[], languageCode: string): Promise<string[][]>
  vectorize_tokens(tokens: string[], languageCode: string): Promise<number[][]>
  generateSimilarJunkWords(vocabulary: string[], languageCode: string): Promise<string[]>
  ducklingExtractor: EntityExtractor
  mlToolkit: typeof sdk.MLToolkit
}

export interface Model {
  languageCode: string
  startedAt: Date
  finishedAt: Date
  success: boolean
  data: {
    input: TrainInput
    output?: TrainOutput
    artefacts?: TrainArtefacts
  }
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
      vocabVectors: vectorsVocab(output.intents),
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

const preprocessInput = async (input: TrainInput, tools: Tools): Promise<TrainOutput> => {
  input = cloneDeep(input)
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

export const computeKmeans = (intents: Intent<Utterance>[], tools: Tools): sdk.MLToolkit.KMeans.KmeansResult => {
  const data = _.chain(intents)
    .filter(i => i.name !== NONE_INTENT)
    .flatMapDeep(i => i.utterances.map(u => u.tokens))
    // @ts-ignore
    .uniqBy((t: UtteranceToken) => t.value)
    .map((t: UtteranceToken) => t.vectors)
    .value() as number[][]

  if (_.isEmpty(data) || data.length < 2) {
    return
  }

  const k = data.length > NUM_CLUSTERS ? NUM_CLUSTERS : 2

  return tools.mlToolkit.KMeans.kmeans(data, k, KMEANS_OPTIONS)
}

export const ClusterTokens = (input: TrainOutput, tools: Tools): TrainOutput => {
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

type ExactMatchIndex = _.Dictionary<{ intent: string; contexts: string[] }>

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

// TODO vectorized implementation of this
// Taken from https://github.com/facebookresearch/fastText/blob/26bcbfc6b288396bd189691768b8c29086c0dab7/src/fasttext.cc#L486s
const computeSentenceEmbedding = (utterance: Utterance): number[] => {
  let totalWeight = 0
  let sentenceEmbedding = new Array(utterance.tokens[0].vectors.length).fill(0)

  for (const token of utterance.tokens) {
    const norm = computeNorm(token.vectors as number[])
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
  input: TrainOutput,
  tools: Tools
): Promise<_.Dictionary<string> | undefined> => {
  if (input.intents.length === 0) {
    return
  }
  const svmPerCtx: _.Dictionary<string> = {}
  for (const ctx of input.contexts) {
    const points = _.chain(input.intents)
      .filter(i => i.contexts.includes(ctx) && i.utterances.length > 3) // min utterances
      .flatMap(i =>
        i.utterances.map(utt => ({
          label: i.name,
          coordinates: computeSentenceEmbedding(utt)
        }))
      )
      .value()

    if (points.length === 0) {
      continue
    }
    const svm = new tools.mlToolkit.SVM.Trainer()
    svmPerCtx[ctx] = await svm.train(points, SVM_OPTIONS, p => debugIntentsTrain('svm progress ==> %d', p))
  }

  return svmPerCtx
}

export const trainContextClassifier = async (input: TrainOutput, tools: Tools): Promise<string | undefined> => {
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

  if (points.length === 0) {
    return
  }
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

  for (const intent of copy.intents.filter(i => (i.slot_definitions || []).length > 0)) {
    intent.utterances.forEach(async utterance => await extractUtteranceEntities(utterance, input, tools))
  }

  return copy
}

const extractUtteranceEntities = async (utterance: Utterance, input: TrainOutput | PredictStep, tools: Tools) => {
  const extractedEntities = [
    ...extractListEntities(utterance, input.list_entities),
    ...extractPatternEntities(utterance, input.pattern_entities),
    ...(await extractSystemEntities(utterance, input.languageCode, tools))
  ] as EntityExtractionResult[]

  extractedEntities.forEach(entityRes => {
    utterance.tagEntity(_.omit(entityRes, ['start, end']), entityRes.start, entityRes.end)
  })
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

const Utterances = async (raw_utterances: string[], languageCode: string, tools: Tools): Promise<Utterance[]> => {
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

export interface PredictInput {
  defaultLanguage: string
  includedContexts: string[]
  sentence: string
}

// only to comply with E1
type E1IntentPred = {
  name: string
  context: string
  confidence: number
}

export type PredictStep = TrainArtefacts & {
  readonly rawText: string
  includedContexts: string[]
  detectedLanguage: string
  languageCode: string
  intents: Intent<Utterance>[]
  pattern_entities: PatternEntity[]
  predictors: Predictors
  tools: Tools
  utterance?: Utterance
  ctx_predictions?: sdk.MLToolkit.SVM.Prediction[]
  intent_predictions?: {
    per_ctx?: _.Dictionary<sdk.MLToolkit.SVM.Prediction[]>
    combined?: E1IntentPred[] // only to comply with E1
    elected?: E1IntentPred // only to comply with E1
    ambiguous?: boolean
  }
  // TODO slots predictions per intent
}

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

const predict = {
  DetectLanguage: async (
    input: PredictInput,
    supportedLanguages: string[],
    tools: Tools
  ): Promise<{ detectedLanguage: string; usedLanguage: string }> => {
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
  },
  PrepareInput: async (
    input: PredictInput,
    tools: Tools,
    modelsByLang: _.Dictionary<Model>,
    predictorsBylang: _.Dictionary<Predictors>
  ): Promise<PredictStep> => {
    const { detectedLanguage, usedLanguage } = await predict.DetectLanguage(input, Object.keys(modelsByLang), tools)
    const model = modelsByLang[usedLanguage]

    const intents = model.data.output
      ? model.data.output.intents
      : await ProcessIntents(model.data.input.intents, model.languageCode, model.data.artefacts.list_entities, tools)

    return {
      ...model.data.artefacts,
      pattern_entities: model.data.input.pattern_entities,
      includedContexts: input.includedContexts,
      rawText: input.sentence,
      detectedLanguage,
      languageCode: usedLanguage,
      intents,
      predictors: predictorsBylang[usedLanguage],
      tools: tools
    }
  },
  PredictionUtterance: async (input: PredictStep): Promise<PredictStep> => {
    const [utterance] = await Utterances([input.rawText], input.languageCode, input.tools)

    const { tfidf, vocabVectors, predictors } = input
    utterance.tokens.forEach(token => {
      const t = token.toString({ lowerCase: true })
      if (!tfidf[t]) {
        const closestToken = getClosestToken(t, <number[]>token.vectors, vocabVectors)
        tfidf[t] = tfidf[closestToken]
      }
    })

    utterance.setGlobalTfidf(tfidf)
    utterance.setKmeans(predictors.kmeans)

    return {
      ...input,
      utterance
    }
  },
  ExtractEntities: async (input: PredictStep): Promise<PredictStep> => {
    await extractUtteranceEntities(input.utterance!, input, input.tools)
    return { ...input }
  },
  PredictContext: async (input: PredictStep): Promise<PredictStep> => {
    if (input.intents.length === 0) {
      return { ...input, ctx_predictions: [{ label: DEFAULT_CTX, confidence: 1 }] }
    }

    const features = computeSentenceEmbedding(input.utterance)
    const predictions = await input.predictors.ctx_classifer.predict(features)

    return {
      ...input,
      ctx_predictions: predictions
    }
  },
  PredictIntent: async (input: PredictStep) => {
    if (input.intents.length === 0) {
      return { ...input, intent_predictions: { per_ctx: { [DEFAULT_CTX]: [{ label: NONE_INTENT, confidence: 1 }] } } }
    }

    const ctxToPredict = input.ctx_predictions.map(p => p.label)
    const predictions = (await Promise.map(ctxToPredict, async ctx => {
      const predictor = input.predictors.intent_classifier_per_ctx[ctx]
      if (!predictor) {
        return
      }
      const features = [...computeSentenceEmbedding(input.utterance), input.utterance.tokens.length]
      const preds = await predictor.predict(features)
      const exactPred = findExactIntentForCtx(input.exact_match_index, input.utterance, ctx)
      if (exactPred) {
        preds.unshift(exactPred)
      }

      return preds
    })).filter(_.identity)

    return {
      ...input,
      intent_predictions: { per_ctx: _.zipObject(ctxToPredict, predictions) }
    }
  },
  // TODO implement this algorithm properly / improve it
  // currently taken as is from svm classifier (engine 1) and does't make much sens
  ElectIntent: (input: PredictStep) => {
    const totalConfidence = Math.min(1, _.sumBy(input.ctx_predictions, 'confidence'))
    const ctxPreds = input.ctx_predictions.map(x => ({ ...x, confidence: x.confidence / totalConfidence }))

    // taken from svm classifier #295
    // this means that the 3 best predictions are really close, do not change magic numbers
    const predictionsReallyConfused = (predictions: sdk.MLToolkit.SVM.Prediction[]): boolean => {
      const intentsPreds = predictions.filter(x => x.label !== 'none')
      if (intentsPreds.length <= 2) {
        return false
      }
      const std = math.std(intentsPreds.map(p => p.confidence))
      const diff = (intentsPreds[0].confidence - intentsPreds[1].confidence) / std
      if (diff >= 2.5) {
        return false
      }
      const bestOf3STD = math.std(predictions.slice(0, 3).map(p => p.confidence))
      return bestOf3STD <= 0.03
    }

    // taken from svm classifier #349
    const predictions = _.chain(ctxPreds)
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

    return _.merge(_.cloneDeep(input), {
      intent_predictions: { combined: predictions, elected: _.maxBy(predictions, 'confidence') }
    })
  },
  AmbiguityDetection: (input: PredictStep) => {
    // +- 10% away from perfect median leads to ambiguity
    const preds = input.intent_predictions.combined
    const perfectConfusion = 1 / preds.length
    const low = perfectConfusion - 0.1
    const up = perfectConfusion + 0.1
    const confidenceVec = preds.map(p => p.confidence)

    const ambiguous = preds.length > 1 && allInRange(confidenceVec, low, up)

    return _.merge(_.cloneDeep(input), { intent_predictions: { ambiguous } })
  },
  ExtractSlots: async (input: PredictStep) => {
    const intent =
      !input.intent_predictions.ambiguous && input.intents.find(i => i.name === input.intent_predictions.elected.name)
    if (intent && intent.slot_definitions.length > 0) {
      // TODO try to extract for each intent predictions and then rank this in the election step
      const slots = await input.predictors.slot_tagger.extract(input.utterance, intent)
      slots.forEach(({ slot, start, end }) => {
        input.utterance.tagSlot(slot, start, end)
      })
    }

    return { ...input }
  }
}

type PredictOutput = sdk.IO.EventUnderstanding // temporary fully compliant with engine1
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

  const slots = step.utterance.slots.reduce(
    (slots, s) => {
      return {
        ...slots,
        [s.name]: {
          confidence: s.confidence,
          name: s.name,
          source: s.source,
          value: s.source // TODO replace by value once added in the slot
          // TODO add entity ?
        } as sdk.NLU.Slot
      }
    },
    {} as sdk.NLU.SlotCollection
  )
  return {
    ambiguous: step.intent_predictions.ambiguous,
    detectedLanguage: step.detectedLanguage,
    entities,
    errored: false,
    includedContexts: step.includedContexts,
    intent: step.intent_predictions.elected,
    intents: step.intent_predictions.combined,
    language: step.languageCode,
    slots,
    ms: Date.now() - startTime
  }
}

export const Predict = async (
  input: PredictInput,
  trainTools: Tools,
  modelsByLang: _.Dictionary<Model>,
  predictorsByLang: _.Dictionary<Predictors>
): Promise<PredictOutput> => {
  try {
    const t0 = Date.now()
    let stepOutput = await predict.PrepareInput(input, trainTools, modelsByLang, predictorsByLang)

    stepOutput = await predict.PredictionUtterance(stepOutput)
    stepOutput = await predict.ExtractEntities(stepOutput)
    stepOutput = await predict.PredictContext(stepOutput)
    stepOutput = await predict.PredictIntent(stepOutput)
    stepOutput = predict.ElectIntent(stepOutput)
    stepOutput = predict.AmbiguityDetection(stepOutput)
    stepOutput = await predict.ExtractSlots(stepOutput)
    return MapStepToOutput(stepOutput, t0)
  } catch (err) {
    console.log('Could not perform predict predict data', err)
    return { errored: true } as sdk.IO.EventUnderstanding
  }
}
