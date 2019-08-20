import _, { cloneDeep } from 'lodash'

import { isWord, SPACE } from './tools/token-utils'

export default class Engine2 {}

export type StructuredTrainInput = Readonly<{
  botId: string
  languageCode: string
  pattern_entities: PatternEntity[]
  list_entities: ListEntity[]
  contexts: string[]
  intents: Intent<string>[]
}>

export type StructuredTrainOutput = {
  botId: string
  languageCode: string
  pattern_entities: PatternEntity[]
  list_entities: ListEntity[]
  contexts: string[]
  intents: Intent<Utterance>[]
}

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
  tagEntity(entity: ExtractedEntity, range: UtteranceRange)
  tagSlot(slot: ExtractedSlot, range: UtteranceRange)
  entities: ReadonlyArray<UtteranceEntity>
  slots: ReadonlyArray<UtteranceSlot>
  tokens: ReadonlyArray<UtteranceToken>
}>

const createUtterance = (tokens: UtteranceToken[]): Utterance => {
  // TODO:
  return {
    entities: [],
    slots: [],
    tagEntity: () => {},
    tagSlot: () => {},
    toString: () => '',
    tokens: tokens
  }
}

class UtteranceClass implements Utterance {
  public tokens: ReadonlyArray<UtteranceToken> = []

  get slots(): ReadonlyArray<UtteranceSlot> {
    return [] // TODO:
  }

  get entities(): ReadonlyArray<UtteranceEntity> {
    return [] // TODO:
  }

  constructor(tokens: string[], vectors: number[][]) {
    const arr = []
    for (let i = 0, offset = 0; i < tokens.length; i++) {
      const value = tokens[i]
      arr.push({
        index: i,
        isBOS: i === 0,
        isEOS: i === tokens.length - 1,
        isWord: isWord(value),
        offset: offset,
        get slot(): string | undefined {
          return '' // TODO:
        },
        get entities(): ReadonlyArray<ExtractedEntity> {
          return [] // TODO:
        },
        startsWithSpace: value.startsWith(SPACE),
        tfidf: 0,
        value: value,
        vectors: vectors[i],
        slotIndex: 0
      })
      offset += value.length
    }
    this.tokens = arr
  }

  toString(options: UtteranceToStringOptions): string {
    return ''
    // let ret = [...toks]
    // if (options.onlyWords) {
    //   ret = ret.filter(tok => tok.slot || tok.isWord)
    // }
    // return toks.reduce((prev, curr) => {
    //   if (curr.slot) {
    //     switch (options.slots) {
    //       case 'keep-slot-name':
    //         return prev + curr.slot
    //       case 'keep-value':
    //       default:
    //         return prev + curr.value
    //     }
    //   } else {
    //     if (!curr.isWord && options.onlyWords) {
    //       return prev
    //     }
    //     return prev + curr.value
    //   }
    // }, '')
    // return ''
  }

  clone(copyEntities: boolean, copySlots: boolean): UtteranceClass {
    const tokens = this.tokens.map(x => x.value)
    const vectors = this.tokens.map(x => <number[]>x.vectors)
    const utterance = new UtteranceClass(tokens, vectors)

    if (copyEntities) {
      this.entities.forEach(entity => utterance.tagEntity(entity, entity))
    }

    if (copySlots) {
      this.slots.forEach(slot => utterance.tagSlot(slot, slot))
    }

    return utterance
  }

  tagEntity(entity: ExtractedEntity, range: UtteranceRange) {}
  tagSlot(slot: ExtractedSlot, range: UtteranceRange) {}
}

export type UtteranceToStringOptions = {
  lowerCase: boolean
  onlyWords: boolean
  slots: 'keep-value' | 'keep-slot-name' | 'keep-entity-name'
}

export type UtteranceRange = { startTokenIdx: number; endTokenIdx: number }
export type ExtractedEntity = { confidence: number; type: string; metadata: any }
export type ExtractedSlot = { confidence: number; name: string }
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
  slot?: string
  slotIndex?: number
}>

export interface Trainer {
  (input: StructuredTrainInput, tools: TrainTools, cancelToken: CancellationToken): TrainResult
}

export const Trainer: Trainer = async (input, tools, cancelToken) => {
  try {
    // TODO: make tools from entities
    input = cloneDeep(input)
    let output = await ProcessUtterances(input, tools)
    output = await AppendNoneIntents(output, tools)
    output = await TagUtterances(output, tools)
    output = await TfidfTokens(output, tools)

    const context_ranking = await {} //

    const artefacts = {
      context_ranking: {},
      svm_classifier: {},
      exact_classifier: {},
      slot_tagger: {}
    }

    //
  } catch (err) {}
  return {}
}

export const ProcessUtterances = async (
  input: StructuredTrainInput,
  tools: TrainTools
): Promise<StructuredTrainOutput> => {
  const intents = await Promise.map(input.intents, async intent => {
    const chunked_utterances = intent.utterances.map(u => ChunkUtterance(u, intent.slot_definitions))
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
  return cloneDeep(input) // TODO:
}

export const TagUtterances = async (
  input: StructuredTrainOutput,
  tools: TrainTools
): Promise<StructuredTrainOutput> => {
  return {} as StructuredTrainOutput // TODO:
}

export const TfidfTokens = async (input: StructuredTrainOutput, tools: TrainTools): Promise<StructuredTrainOutput> => {
  return {} as StructuredTrainOutput // TODO:
}

export type UtteranceChunk = {
  value: string
  slotIdx?: number
  slotName?: string
  entities?: string[]
}

const ChunkUtterance = (utterance: string, slotDefinitions: SlotDefinition[]): UtteranceChunk[] => {
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
    // TODO: tagEntities
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
} // const vecs = (await langProvider.vectorize(doc, lang)).map(x => Array.from(x.values()))

export interface Model {
  languageCode: string
  inputData: StructuredTrainInput
  outputData: StructuredTrainOutput
  startedAt: Date
  finishedAt: Date
  artefacts: any[] // TODO:
}
