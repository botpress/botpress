import { MLToolkit, NLU } from 'botpress/sdk'
import _ from 'lodash'

import jaroDistance from '../tools/jaro'
import levenDistance from '../tools/levenshtein'
import { extractPattern, isPatternValid } from '../tools/patterns-utils'
import { EntityExtractor } from '../typings'

import CRFExtractor2 from './crf-extractor2'
import { Model } from './model-service'
import { Predict, PredictInput, Predictors, PredictOutput, PredictStep } from './predict-pipeline'
import { CancellationToken, computeKmeans, ProcessIntents, Trainer, TrainInput, TrainOutput } from './training-pipeline'
import Utterance, { UtteranceToken } from './utterance'

export type TFIDF = _.Dictionary<number>
export type E2ByBot = _.Dictionary<Engine2>

export default class Engine2 {
  private static tools: Tools
  private predictorsByLang: _.Dictionary<Predictors> = {}
  private modelsByLang: _.Dictionary<Model> = {}

  constructor(private defaultLanguage: string, private logger: sdk.Logger) {}

  static provideTools(tools: Tools) {
    Engine2.tools = tools
  }

  async train(
    intentDefs: NLU.IntentDefinition[],
    entityDefs: NLU.EntityDefinition[],
    languageCode: string
  ): Promise<Model> {
    const token: CancellationToken = {
      cancel: async () => {},
      uid: '',
      isCancelled: () => false,
      cancelledAt: new Date()
    }

    const list_entities = entityDefs
      .filter(ent => ent.type === 'list')
      .map(e => {
        return {
          name: e.name,
          fuzzyMatching: e.fuzzy,
          sensitive: e.sensitive,
          synonyms: _.chain(e.occurences)
            .keyBy('name')
            .mapValues('synonyms')
            .value()
        }
      })

    const pattern_entities = entityDefs
      .filter(ent => ent.type === 'pattern' && isPatternValid(ent.pattern))
      .map(ent => ({
        name: ent.name,
        pattern: ent.pattern,
        examples: [], // TODO add this to entityDef
        ignoreCase: true, // TODO add this entityDef
        sensitive: ent.sensitive
      }))

    const contexts = _.chain(intentDefs)
      .flatMap(i => i.contexts)
      .uniq()
      .value()

    const input: TrainInput = {
      languageCode,
      list_entities,
      pattern_entities,
      contexts,
      intents: intentDefs.map(x => ({
        name: x.name,
        contexts: x.contexts,
        utterances: x.utterances[languageCode],
        slot_definitions: x.slots
      }))
    }

    // Model should be build here, Trainer should not have any idea of how this is stored
    const model = await Trainer(input, Engine2.tools, token)
    if (model.success) {
      this.logger.info('Successfully finished training')
      await this.loadModel(model)
    }
    return model
  }

  async loadModels(models: Model[]) {
    return Promise.map(models, model => this.loadModel(model))
  }

  async loadModel(model: Model) {
    if (
      this.predictorsByLang[model.languageCode] !== undefined &&
      this.modelsByLang[model.languageCode] !== undefined &&
      _.isEqual(this.modelsByLang[model.languageCode].data.input, model.data.input) // compare hash instead
    ) {
      return
    }

    if (!model.data.output) {
      const intents = await ProcessIntents(
        model.data.input.intents,
        model.languageCode,
        model.data.artefacts.list_entities,
        Engine2.tools
      )
      model.data.output = { intents } as TrainOutput // needed for prediction
    }

    this.predictorsByLang[model.languageCode] = await this._makePredictors(model)
    this.modelsByLang[model.languageCode] = model
    this.logger.info('Model loaded')
  }

  private async _makePredictors(model: Model): Promise<Predictors> {
    const { input, output, artefacts } = model.data
    const tools = Engine2.tools

    if (input.intents.length > 0) {
      const ctx_classifer = new tools.mlToolkit.SVM.Predictor(artefacts.ctx_model)
      const intent_classifier_per_ctx = _.toPairs(artefacts.intent_model_by_ctx).reduce(
        (c, [ctx, intentModel]) => ({ ...c, [ctx]: new tools.mlToolkit.SVM.Predictor(intentModel as string) }),
        {} as _.Dictionary<MLToolkit.SVM.Predictor>
      )
      const slot_tagger = new CRFExtractor2(tools.mlToolkit) // TODO change this for MLToolkit.CRF.Tagger
      slot_tagger.load(artefacts.slots_model)

      const kmeans = computeKmeans(output.intents, tools) // TODO load from artefacts when persistd

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

export interface Tools {
  tokenize_utterances(utterances: string[], languageCode: string): Promise<string[][]>
  vectorize_tokens(tokens: string[], languageCode: string): Promise<number[][]>
  generateSimilarJunkWords(vocabulary: string[], languageCode: string): Promise<string[]>
  ducklingExtractor: EntityExtractor
  mlToolkit: typeof MLToolkit
}

// add value in extracted slots
export type ExtractedSlot = { confidence: number; name: string; source: any }
export type ExtractedEntity = { confidence: number; type: string; metadata: any; value: string }
export type EntityExtractionResult = ExtractedEntity & { start: number; end: number }

export const extractUtteranceEntities = async (
  utterance: Utterance,
  input: TrainOutput | PredictStep,
  tools: Tools
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
