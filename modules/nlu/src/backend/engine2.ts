import { MLToolkit } from 'botpress/sdk'
import _, { cloneDeep } from 'lodash'

import jaroDistance from './pipelines/entities/jaro'
import levenDistance from './pipelines/entities/levenshtein'
import tfidf from './pipelines/intents/tfidf'
import LanguageIdentifierProvider, { NA_LANG } from './pipelines/language/ft_lid'
import CRFExtractor2 from './pipelines/slots/crf-extractor2'
import { isSpace, isWord, SPACE } from './tools/token-utils'

export default class Engine2 {
  private tools: TrainTools

  provideTools = (tools: TrainTools) => {
    this.tools = tools
  }

  async train(input: StructuredTrainInput) {
    const token: CancellationToken = {
      // TODO:
      cancel: async () => {},
      uid: '',
      isCancelled: () => false,
      cancelledAt: new Date()
    }

    await Trainer(input, this.tools, token)
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
  vocab: _.Dictionary<boolean>
  slot_entities: string[]
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

export const extractRegexEntities = () => {}

export const extractSystemEntities = async () => {
  // call duckling extractor
}

export class UtteranceClass implements Utterance {
  public tokens: ReadonlyArray<UtteranceToken> = []
  public slots: ReadonlyArray<UtteranceRange & UtteranceSlot> = []
  public entities: ReadonlyArray<UtteranceRange & UtteranceEntity> = []
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
        // TODO extract this as token util makeToken
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
          tfidf: (this._globalTfidf && this._globalTfidf[value]) || 1,
          value: value,
          vectors: vectors[i],
          // TODO extract this in strig utils and reuse for utterance
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

    const slot_tagger = await trainSlotTagger(output, tools)

    output.intents[0]

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

// TODO test this (build intent vocab)
export const buildVocab = (utterances: Utterance[]): _.Dictionary<boolean> => {
  return _.chain(utterances)
    .flatMap(u => u.tokens)
    .reduce((vocab: _.Dictionary<boolean>, tok) => ({ ...vocab, [tok.value]: true }), {})
    .value()
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
    const cleaned = intent.utterances.map(u => u.replace(/(\s)+/g, ' ')) // replacing repeating spaces just like tokenizer does
    const chunked_utterances = cleaned.map(u => ChunkSlotsInUtterance(u, intent.slot_definitions))
    const parsed_utterances = chunked_utterances.map(chunks => chunks.map(x => x.value).join(''))
    const utterances = await Utterances(parsed_utterances, languageCode, tools)
    // Add identified slots in each utterances
    _.zip(utterances, chunked_utterances).forEach(([utterance, chuncked]) => {
      chuncked.reduce((cursor: number, chunck) => {
        const end = cursor + chunck.value.length
        if (chunck.slotName) {
          utterance.tagSlot({ name: chunck.slotName, source: chunck.value, confidence: 1 }, cursor, end)
        }
        return end
      }, 0)
    })

    const vocab = buildVocab(utterances)
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
    contexts: [...input.contexts],
    vocab: {},
    slot_entities: []
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

  // TODO add word cluster here ?
  return utterances
}

const trainSlotTagger = async (input: StructuredTrainOutput, tools: TrainTools): Promise<{ crf: Buffer }> => {
  const crfExtractor = new CRFExtractor2(tools.mlToolkit)
  return crfExtractor.train(input.intents)
}

export interface TrainResult {}

export interface Predictor {
  languageCode: string
  predict(text: string): Promise<void>
}

export interface PredictInput {
  // TODO add lastMessages ?
  supportedLanguages: string[]
  defaultLanguage: string
  sentence: string
}

// interface PredictOutput {}
export interface PredictOutput {
  // sentence: Utterance
  detectedLanguage: string
  usedLanguage: string
  // slots: _.Dictionary<ExtractedSlot>
  // entities: ExtractedEntity[]
  // ambiguous: boolean
  // contexts: ContextPrediction[]
  // intents: IntentPrediction[]
}

// TODO pass a predictOutput with prediction utterance
const detectLanguage = async (input: PredictInput, toolkit: typeof MLToolkit): Promise<PredictOutput> => {
  const langIdentifier = LanguageIdentifierProvider.getLanguageIdentifier(toolkit)
  const elected = (await langIdentifier.identify(input.sentence))[0]

  // TODO use this! ==> will need prediction utterance for this
  // const threshold = ds.tokens.length > 1 ? 0.5 : 0.3 // because with single-word sentences (and no history), confidence is always very low
  const threshold = 0.5
  let detectedLanguage = _.get(elected, 'label', NA_LANG)
  if (detectedLanguage !== NA_LANG && !input.supportedLanguages.includes(detectedLanguage)) {
    detectedLanguage = NA_LANG
  }

  return {
    detectedLanguage,
    usedLanguage: detectedLanguage !== NA_LANG && elected.value > threshold ? detectedLanguage : input.defaultLanguage
  }
}

// TODO maybe change toolkit for PredictTools ==> be consistent with training pipeline
export const Predict = async (input: PredictInput, toolkit: typeof MLToolkit) => {
  const output = await detectLanguage(input, toolkit)

  // SENTENCE PROCESSING PIPELINE --> PredictionUtterance
  // CompleteStructure --> PREDICT PIPELINE
  // prepare_utterance pipeline
  //     for each tokens we need to set tfidf using getClosestToken
  // rank contexts
  // predict intents
  // extract slots
  // ambiguity detection

  return output
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
  mlToolkit: typeof MLToolkit
} // const vecs = (await langProvider.vectorize(doc, lang)).map(x => Array.from(x.values()))

export interface Model {
  languageCode: string
  inputData: StructuredTrainInput
  outputData: StructuredTrainOutput
  startedAt: Date
  finishedAt: Date
  artefacts: any[] // TODO:
}
