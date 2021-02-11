import _ from 'lodash'
import { Intent } from 'nlu-core/typings'
import Utterance, { UtteranceToStringOptions } from 'nlu-core/utterance/utterance'

import { IntentClassifier, IntentPredictions, IntentTrainInput } from './intent-classifier'

interface Model {
  intents: string[]
  exact_match_index: ExactMatchIndex
}

type ExactMatchIndex = _.Dictionary<{ intent: string }>

const EXACT_MATCH_STR_OPTIONS: UtteranceToStringOptions = {
  lowerCase: true,
  onlyWords: true,
  slots: 'keep-value', // slot extraction is done in || with intent prediction
  entities: 'keep-name'
}

export class ExactIntenClassifier implements IntentClassifier {
  private static _name = 'Exact Intent Classifier'
  private model: Model | undefined

  async train(trainInput: IntentTrainInput, progress: (p: number) => void) {
    const { intents } = trainInput
    const exact_match_index = this._buildExactMatchIndex(intents)

    this.model = {
      intents: intents.map(i => i.name),
      exact_match_index
    }
    progress(1)
  }

  private _buildExactMatchIndex = (intents: Intent<Utterance>[]): ExactMatchIndex => {
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

  serialize() {
    if (!this.model) {
      throw new Error(`${ExactIntenClassifier._name} must be trained before calling serialize.`)
    }
    return JSON.stringify(this.model)
  }

  load(serialized: string) {
    const model: Model = JSON.parse(serialized) // TODO: validate input
    this.model = model
  }

  async predict(utterance: Utterance): Promise<IntentPredictions> {
    if (!this.model) {
      throw new Error(`${ExactIntenClassifier._name} must be trained before calling predict.`)
    }

    const { exact_match_index, intents: intentNames } = this.model
    const exactPred = this._findExactIntent(exact_match_index, utterance)

    if (exactPred) {
      return {
        intents: [{ name: exactPred, confidence: 1, extractor: 'exact-matcher' }]
      }
    }
    return {
      intents: []
    }
  }

  private _findExactIntent(exactMatchIndex: ExactMatchIndex, utterance: Utterance): string | undefined {
    const candidateKey = utterance.toString(EXACT_MATCH_STR_OPTIONS)
    const maybeMatch = exactMatchIndex[candidateKey]
    if (maybeMatch) {
      return maybeMatch.intent
    }
  }
}
