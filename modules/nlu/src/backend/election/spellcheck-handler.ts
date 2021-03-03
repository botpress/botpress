import _ from 'lodash'
import nluCore from 'nlu-core'

import { NONE_INTENT, ValueOf } from './typings'

const mergeSpellChecked = (
  originalOutput: nluCore.PredictOutput,
  spellCheckedOutput: nluCore.PredictOutput
): nluCore.PredictOutput => {
  const mostConfidentContext = (preds: nluCore.Predictions): ValueOf<nluCore.Predictions> =>
    _(preds)
      .values()
      .maxBy(p => p.confidence)!

  const mostConfidentIntent = (preds: ValueOf<nluCore.Predictions>) =>
    _(preds.intents)
      .filter(i => i.label !== NONE_INTENT)
      .maxBy(i => i.confidence)!

  const originalPredictions: nluCore.Predictions = originalOutput.predictions!
  const spellCheckedPredictions: nluCore.Predictions = spellCheckedOutput.predictions!

  const mergeContextConfidence =
    mostConfidentContext(originalPredictions).confidence < mostConfidentContext(spellCheckedPredictions).confidence

  for (const ctx of Object.keys(originalPredictions)) {
    const originalPred = originalPredictions[ctx]
    const spellCheckedPred = spellCheckedPredictions[ctx]

    if (mergeContextConfidence) {
      originalPred.confidence = _.mean([originalPred.confidence, spellCheckedPred.confidence])
    }

    if (
      originalPred.intents.length &&
      mostConfidentIntent(originalPred).confidence <= mostConfidentIntent(spellCheckedPred).confidence
    ) {
      for (const intent of originalPred.intents) {
        const originalIntent = originalPred.intents.find(i => i.label === intent.label)!
        const spellCheckedIntent = spellCheckedPred.intents.find(i => i.label === intent.label)!
        intent.confidence = _.max([originalIntent.confidence, spellCheckedIntent.confidence])!
      }
    }

    originalPred.oos = spellCheckedPred.oos
  }

  return { ...originalOutput, predictions: originalPredictions }
}
export default mergeSpellChecked
