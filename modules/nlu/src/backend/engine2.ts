import _, { cloneDeep } from 'lodash'

import tfidf from './pipelines/intents/tfidf'
import { isWord, SPACE } from './tools/token-utils'

export default class Engine2 {
  private tools: TrainTools

  provideTools = (tools: TrainTools) => {
    this.tools = tools
  }

  train(input: StructuredTrainInput) {
    const token: CancellationToken = {
      // TODO:
      cancel: async () => {},
      uid: '',
      isCancelled: () => false,
      cancelledAt: new Date()
    }

    Trainer(input, this.tools, token)
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
}>

export type SlotDefinition = Readonly<{
  name: string
  entities: string[]
}>

export type ListEntityModel = Readonly<{
  type: 'custom.list' | 'custom.pattern'
  id: string
  languageCode: string
  entityName: string
  fuzzyMatching: boolean
  sensitive: boolean
  /** @example { 'Air Canada': [ ['Air', '_Canada'], ['air', 'can'] ] } */
  mappingsTokens: _.Dictionary<string[][]>
}>

export type Utterance = Readonly<{
  toString(options: UtteranceToStringOptions): string
  tagEntity(entity: ExtractedEntity, start: number, end: number)
  tagSlot(slot: ExtractedSlot, start: number, end: number)
  setGlobalTfidf(tfidf: _.Dictionary<number>)
  entities: ReadonlyArray<UtteranceEntity>
  slots: ReadonlyArray<UtteranceSlot>
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
  return _.takeWhile(arr.slice(start), t => {
    const b = total
    total += t.toString().length
    return b < desiredLength
  })
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
        score += 1
      } else if (str1[i].toLowerCase() === str2[i].toLowerCase()) {
        score += 0.75
      }
    }
    return score / max
  }
  //
  const fuzzyScore = (a: string[], b: string[]): number => {
    return 0 // TODO:
  }
  //
  const structuralScore = (a: string[], b: string[]): number => {
    const charset1 = _.uniq(_.flatten(a.map(x => x.toLowerCase().split(''))))
    const charset2 = _.uniq(_.flatten(b.map(x => x.toLowerCase().split(''))))
    const charset_score = _.intersection(charset1, charset2).length / _.union(charset1, charset2).length

    const token_qty_score = Math.min(a.length, b.length) / Math.max(a.length, b.length)

    const size1 = _.sumBy(a, 'length')
    const size2 = _.sumBy(b, 'length')
    const token_size_score = Math.min(size1, size2) / Math.max(size1, size2)

    return charset_score * token_qty_score * token_size_score
  }

  const matches: EntityExtractionResult[] = []

  for (const list of list_entities) {
    const candidates = []
    for (const [canonical, occurances] of _.toPairs(list.mappingsTokens)) {
      for (const occurance of occurances) {
        for (let i = 0; i < utterance.tokens.length; i++) {
          const workset = takeUntil(utterance.tokens, i, _.sumBy(occurance, 'length'))
          const worksetAsStrings = workset.map(x => x.toString())

          const exact_score = exactScore(worksetAsStrings, occurance)
          const fuzzy_score = list.fuzzyMatching ? fuzzyScore(worksetAsStrings, occurance) : 0
          const structural_score = structuralScore(worksetAsStrings, occurance)
          const finalScore = (exact_score + fuzzy_score) * structural_score

          candidates.push({
            score: finalScore,
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
          // so we take squared root of its length into account
          x => x.score * Math.sqrt(x.source.length),
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

export const extractRegexEntities = () => {}

export const extractSystemEntities = async () => {
  // call duckling extractor
}

export class UtteranceClass implements Utterance {
  public tokens: ReadonlyArray<UtteranceToken> = []
  public slots: ReadonlyArray<UtteranceSlot> = []
  public entities: ReadonlyArray<UtteranceEntity> = []
  private _globalTfidf?: _.Dictionary<number>

  setGlobalTfidf(tfidf: _.Dictionary<number>) {
    this._globalTfidf = tfidf
  }

  constructor(tokens: string[], vectors: number[][]) {
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
          get slots(): ReadonlyArray<ExtractedSlot> {
            return that.slots.filter(x => x.startTokenIdx >= i && x.endTokenIdx <= i)
          },
          get entities(): ReadonlyArray<ExtractedEntity> {
            return that.entities.filter(x => x.startTokenIdx >= i && x.endTokenIdx <= i)
          },
          startsWithSpace: value.startsWith(SPACE),
          tfidf: (this._globalTfidf && this._globalTfidf[value]) || 1,
          value: value,
          vectors: vectors[i],
          toString: () => value // TODO: Options for toString
        })
      )
      offset += value.length
    }
    // TODO: merge tokens (special chars)
    this.tokens = arr
  }

  toString(options: UtteranceToStringOptions): string {
    const opts: UtteranceToStringOptions = _.defaultsDeep({}, options, <UtteranceToStringOptions>{
      lowerCase: false,
      slots: 'keep-value'
    })

    let final = ''
    let ret = [...this.tokens]
    if (opts.onlyWords) {
      ret = ret.filter(tok => tok.slots.length || tok.isWord)
    }

    for (const tok of ret) {
      if (tok.slots.length && opts.slots === 'keep-slot-name') {
        final += tok.slots[0].name
      } else {
        final += tok.value
      }
    }

    if (opts.lowerCase) {
      final = final.toLowerCase()
    }

    return final.replace(new RegExp(SPACE, 'g'), ' ')
  }

  clone(copyEntities: boolean, copySlots: boolean): UtteranceClass {
    const tokens = this.tokens.map(x => x.value)
    const vectors = this.tokens.map(x => <number[]>x.vectors)
    const utterance = new UtteranceClass(tokens, vectors)

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
  slots: 'keep-value' | 'keep-slot-name'
}

export type TokenToStringOptions = {
  lowerCase: boolean
  trim: boolean
  realSpaces: boolean
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
  startsWithSpace: boolean
  isBOS: boolean
  isEOS: boolean
  vectors: ReadonlyArray<number>
  tfidf: number
  offset: number
  entities: ReadonlyArray<ExtractedEntity>
  slots: ReadonlyArray<ExtractedSlot>
  toString(options?: TokenToStringOptions): string
}>

export const DefaultTokenToStringOptions: TokenToStringOptions = { lowerCase: false, realSpaces: true, trim: false }

export interface Trainer {
  (input: StructuredTrainInput, tools: TrainTools, cancelToken: CancellationToken): TrainResult
}

export const Trainer: Trainer = async (input, tools, cancelToken) => {
  try {
    // TODO: Cancellation token effect
    input = cloneDeep(input)

    const list_entities = await Promise.map(input.list_entities, list =>
      prepareListEntityModels(list, input.languageCode, tools)
    )

    const intents = await ProcessIntents(input.intents, input.languageCode, tools)

    let output = {
      ..._.omit(input, 'list_entities', 'intents'),
      list_entities,
      intents
    }

    output = await ExtractEntities(output, tools)
    output = await AppendNoneIntents(output, tools)
    output = await TfidfTokens(output)

    const context_ranking = await {}

    const svm = {} // await trainSvm(output, tools)

    const artefacts = {
      tfidf: {},
      kmeans: {},
      context_ranking: {},
      svm_classifier: svm,
      exact_classifier: {},
      slot_tagger: {}
    }

    //
  } catch (err) {}
  return {}
}

// ctx ranking
/*
points = []
for each ctx
  intents = part of ctx / NOT NONE
  for each intent
    for each utterance
      features = [ (vectors * tfidf) + tokens.length ]
      push( features of utterance ) label = ctx
svm = train(points, LINEAR, C_SVC) (progress -> cb | cancel token check)
*/

export const ProcessIntents = async (
  intents: Intent<string>[],
  languageCode: string,
  tools: TrainTools
): Promise<Intent<Utterance>[]> => {
  return Promise.map(intents, async intent => {
    const chunked_utterances = intent.utterances.map(u => ChunkSlotsInUtterance(u, intent.slot_definitions))
    const textual_utterances = chunked_utterances.map(chunks => chunks.map(x => x.value).join(''))
    const utterances = await Utterances(textual_utterances, languageCode, tools)
    // TODO: tag slots
    return { ...intent, utterances: utterances }
  })
}

export const ExtractEntities = async (
  input: StructuredTrainOutput,
  tools: TrainTools
): Promise<StructuredTrainOutput> => {
  // extract list entities
  // extract pattern entities

  return input
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
    name: 'none',
    slot_definitions: [],
    utterances: await Utterances(noneUtterances, input.languageCode, tools),
    contexts: [...input.contexts]
  }

  return { ...input, intents: [...input.intents, intent] }
}

export const TfidfTokens = async (input: StructuredTrainOutput): Promise<StructuredTrainOutput> => {
  const contextTokens = _.zipObject<string[]>(
    input.intents.map(x => x.name),
    _.flattenDeep<string[]>(input.intents.map(x => x.utterances.map(u => u.tokens.map(x => x.value))))
  )

  const { __avg__: avg } = tfidf(contextTokens)
  const copy = { ...input }
  copy.intents.forEach(x => x.utterances.forEach(u => u.setGlobalTfidf(avg)))
  return copy
}

export type UtteranceChunk = {
  value: string
  slotIdx?: number
  slotName?: string
  entities?: string[]
}

export const ChunkSlotsInUtterance = (utterance: string, slotDefinitions: SlotDefinition[]): UtteranceChunk[] => {
  // TODO: Unit Test this
  const slotsRegex = /\[(.+?)\]\(([\w_\. :-]+)\)/gi // local because it is stateful
  const chunks = [] as UtteranceChunk[]

  let cursor = 0
  let slotIdx = 0
  let regResult: RegExpExecArray | null

  while ((regResult = slotsRegex.exec(utterance))) {
    const rawMatch = regResult[0]
    const slotValue = regResult[1] as string
    const slotName = regResult[2] as string

    const slotDef = slotDefinitions.find(sd => sd.name === slotName)

    if (cursor < regResult.index) {
      chunks.push({ value: utterance.slice(cursor, regResult.index) })
    }

    chunks.push({
      value: slotValue,
      slotName: slotName,
      entities: slotDef ? slotDef.entities : [],
      slotIdx: slotIdx++
    })

    cursor = regResult.index + rawMatch.length
  }

  if (cursor < utterance.length) {
    chunks.push({
      value: utterance.slice(cursor, utterance.length)
    })
  }

  return chunks
}

export const Utterances = async (
  textual_utterances: string[],
  languageCode: string,
  tools: TrainTools
): Promise<Utterance[]> => {
  const tokens = await tools.tokenize_utterances(textual_utterances, languageCode)
  const uniqTokens = _.uniq(_.flatten(tokens))
  const vectors = await tools.vectorize_tokens(uniqTokens, languageCode)
  const vectorMap = _.zipObject(uniqTokens, vectors)

  const utterances: Utterance[] = []

  for (let i = 0; i < textual_utterances.length; i++) {
    const vectors = tokens[i].map(v => vectorMap[v])
    const utterance = new UtteranceClass(tokens[i], vectors)

    utterances.push(utterance)
  }

  return utterances
}

export interface TrainResult {}

export interface Predictor {
  languageCode: string
  predict(text: string): Promise<void>
}

// SENTENCE PROCESSING PIPELINE --> PredictionUtterance

// CompleteStructure --> PREDICT PIPELINE
// lang_identification
// prepare_utterance pipeline
// rank contexts
// predict intents
// extract slots
// ambiguity detection

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
} // const vecs = (await langProvider.vectorize(doc, lang)).map(x => Array.from(x.values()))

export interface Model {
  languageCode: string
  inputData: StructuredTrainInput
  outputData: StructuredTrainOutput
  startedAt: Date
  finishedAt: Date
  artefacts: any[] // TODO:
}
