import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { NONE_INTENT, PredictOutput, ValueOf } from './typings'

const mergeOutputs = (originalOutput: PredictOutput, spellCheckedOutput: PredictOutput): PredictOutput => {
  const mostConfidentContext = (preds: sdk.NLU.Predictions): ValueOf<sdk.NLU.Predictions> =>
    _(preds)
      .values()
      .maxBy(p => p.confidence)!

  const mostConfidentIntent = (preds: ValueOf<sdk.NLU.Predictions>) =>
    _(preds.intents)
      .filter(i => i.label !== NONE_INTENT)
      .maxBy(i => i.confidence)!

  const originalPredictions: sdk.NLU.Predictions = originalOutput.predictions!
  const spellCheckedPredictions: sdk.NLU.Predictions = spellCheckedOutput.predictions!

  const mergedPredictions = _.cloneDeep(originalPredictions)

  const mergeContextConfidence =
    mostConfidentContext(originalPredictions).confidence < mostConfidentContext(spellCheckedPredictions).confidence

  for (const ctx of Object.keys(mergedPredictions)) {
    const originalPred = originalPredictions[ctx]
    const spellCheckedPred = spellCheckedPredictions[ctx]

    if (mergeContextConfidence) {
      mergedPredictions[ctx].confidence = _.mean([originalPred.confidence, spellCheckedPred.confidence])
    }

    if (
      originalPred.intents.length &&
      mostConfidentIntent(originalPred).confidence <= mostConfidentIntent(spellCheckedPred).confidence
    ) {
      for (const intent of mergedPredictions[ctx].intents) {
        const originalIntent = originalPred.intents.find(i => i.label === intent.label)!
        const spellCheckedIntent = spellCheckedPred.intents.find(i => i.label === intent.label)!
        intent.confidence = _.max([originalIntent.confidence, spellCheckedIntent.confidence])!
      }
    }

    mergedPredictions[ctx].oos = spellCheckedPred.oos
  }

  return { ...originalOutput, predictions: mergedPredictions }
}
export default mergeOutputs
