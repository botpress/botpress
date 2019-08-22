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
  list_entities: ListEntity[]
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

export type Utterance = Readonly<{
  toString(options: UtteranceToStringOptions): string
  tagEntity(entity: ExtractedEntity, start: number, end: number)
  tagSlot(slot: ExtractedSlot, start: number, end: number)
  setGlobalTfidf(tfidf: _.Dictionary<number>)
  entities: ReadonlyArray<UtteranceEntity>
  slots: ReadonlyArray<UtteranceSlot>
  tokens: ReadonlyArray<UtteranceToken>
}>

class UtteranceClass implements Utterance {
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
          toString: () => value
        })
      )
      offset += value.length
    }
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
export type ExtractedEntity = { confidence: number; type: string; metadata: any }
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
  toString(options: TokenToStringOptions): string
}>

export interface Trainer {
  (input: StructuredTrainInput, tools: TrainTools, cancelToken: CancellationToken): TrainResult
}

export const Trainer: Trainer = async (input, tools, cancelToken) => {
  try {
    // TODO: Cancellation token effect
    input = cloneDeep(input)
    // TODO: Train List Extractor
    let output = await ProcessIntents(input, tools)
    // extract list entities
    // extract pattern entities

    output = await AppendNoneIntents(output, tools)
    output = await TfidfTokens(output)

    const context_ranking = await {}

    const artefacts = {
      listExtractor: {},
      patternExtractor: {},
      context_ranking: {},
      svm_classifier: {},
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
artefacts.push ( ctx_ranking (json) )
*/

export const ProcessIntents = async (
  input: StructuredTrainInput,
  tools: TrainTools
): Promise<StructuredTrainOutput> => {
  const intents = await Promise.map(input.intents, async intent => {
    const chunked_utterances = intent.utterances.map(u => ChunkSlotsInUtterance(u, intent.slot_definitions))
    const textual_utterances = chunked_utterances.map(chunks => chunks.map(x => x.value).join(''))
    const utterances = await Utterances(textual_utterances, input.languageCode, tools)
    // TODO: tag slots
    return { ...intent, utterances: utterances }
  })

  return {
    ...input,
    intents
  }
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

const ChunkSlotsInUtterance = (utterance: string, slotDefinitions: SlotDefinition[]): UtteranceChunk[] => {
  // TODO: Unit Test this
  const slotsRegex = /\[(.+?)\]\(([\w_\.-]+)\)/gi // local because it is stateful
  const chunks = [] as UtteranceChunk[]

  let cursor = 0
  let slotIdx = 0
  let regResult: RegExpExecArray | null

  while ((regResult = slotsRegex.exec(utterance))) {
    const rawMatch = regResult[0]
    const slotValue = regResult[1] as string
    const slotName = regResult[2] as string

    const slotDef = slotDefinitions.find(sd => sd.name === slotName)

    if (slotDef) {
      if (cursor < regResult.index) {
        chunks.push({ value: utterance.slice(cursor, regResult.index) })
      }

      chunks.push({
        value: slotValue,
        slotName: slotName,
        entities: slotDef.entities,
        slotIdx: slotIdx++
      })

      cursor = regResult.index + rawMatch.length
    } else {
      // we're not considering it a slot, we take its value as-is.
    }
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
