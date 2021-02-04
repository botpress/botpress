import _ from 'lodash'
import { Intent } from 'nlu-core/typings'
import Utterance, { UtteranceToStringOptions } from 'nlu-core/utterance/utterance'

export const EXACT_MATCH_STR_OPTIONS: UtteranceToStringOptions = {
  lowerCase: true,
  onlyWords: true,
  slots: 'keep-value', // slot extraction is done in || with intent prediction
  entities: 'keep-name'
}

export const BuildExactMatchIndex = (intents: Intent<Utterance>[]): ExactMatchIndex => {
  return _.chain(intents)
    .flatMap(i =>
      i.utterances.map(u => ({
        utterance: u.toString(EXACT_MATCH_STR_OPTIONS),
        contexts: i.contexts,
        intent: i.name
      }))
    )
    .filter(({ utterance }) => !!utterance)
    .reduce((index, { utterance, intent }) => {
      index[utterance] = { intent }
      return index
    }, {} as ExactMatchIndex)
    .value()
}

export type ExactMatchIndex = _.Dictionary<{ intent: string }>
export interface ExactMatchResult {
  name: string
  confidence: number
  extractor: 'exact-matcher'
}

export function findExactIntent(exactMatchIndex: ExactMatchIndex, utterance: Utterance): ExactMatchResult | undefined {
  const candidateKey = utterance.toString(EXACT_MATCH_STR_OPTIONS)
  const maybeMatch = exactMatchIndex[candidateKey]
  if (maybeMatch) {
    return { name: maybeMatch.intent, confidence: 1, extractor: 'exact-matcher' }
  }
}
