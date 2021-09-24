import * as sdk from 'botpress/sdk'
import { isNotNil } from 'common/type-coersion'
import _ from 'lodash'
import { isContextPrediction, isIntentPrediction } from 'src/utils/utils'

import { detectAmbiguity } from './ambiguous'
import { scaleConfidences } from './math'
import { getMostConfidentContext } from './most-confident'
import { NONE_INTENT, GLOBAL_CONTEXT } from './typings'

export default function naturalElectionPipeline(input: sdk.IO.EventUnderstanding) {
  if (!input.predictions) {
    return input
  }

  let step = electIntent(input)
  step = detectAmbiguity(step)
  step = extractElectedIntentSlot(step)
  return step
}

function electIntent(input: sdk.IO.EventUnderstanding): sdk.IO.EventUnderstanding {
  if (!input.predictions) {
    return input
  }

  const mostConfidentCtx = getMostConfidentContext(input) || {
    name: GLOBAL_CONTEXT,
    confidence: 1.0,
    oos: 0.0,
    intents: []
  }

  const noneIntent = { label: NONE_INTENT, confidence: mostConfidentCtx.oos, slots: {}, extractor: '' }

  const topTwoRaw: sdk.NLU.Intent[] = _([...mostConfidentCtx.intents, noneIntent])
    .orderBy(i => i.confidence, 'desc')
    .map(({ label, confidence }) => ({ name: label, context: mostConfidentCtx.name, confidence }))
    .take(2)
    .value()

  const topTwoScaled = scaleConfidences(topTwoRaw)

  return {
    ...input,
    intent: topTwoScaled[0],
    intents: topTwoScaled
  }
}

function extractElectedIntentSlot(input: sdk.IO.EventUnderstanding): sdk.IO.EventUnderstanding {
  if (!input.predictions) {
    return input
  }

  const elected = input.intent

  if (!isNotNil(elected)) {
    return input
  }

  const electedContext = input.predictions[elected.context]
  if (!isContextPrediction(electedContext)) {
    return input
  }

  const electedContextIntents = electedContext.intents
  if (!Array.isArray(electedContextIntents)) {
    sdk.logger.warn(
      `Warning in ${
        extractElectedIntentSlot.name
      } function: 'electedContext.intents' should be an array. ${JSON.stringify(electedContextIntents)}`
    )
    return input
  }

  const maybeInvalidIntentPrediction = electedContextIntents.some(ec => !isIntentPrediction(ec))
  if (maybeInvalidIntentPrediction) {
    sdk.logger.warn(
      `Warning in ${
        extractElectedIntentSlot.name
      } function: there is an entity in the intents prediction array that does not conform to the IntentPrediction type. ${JSON.stringify(
        maybeInvalidIntentPrediction
      )}`
    )
    return input
  }

  const electedIntent = electedContextIntents.find(i => i.label === elected.name)
  if (!electedIntent) {
    return { ...input, slots: {} }
  }
  return { ...input, slots: electedIntent.slots }
}
