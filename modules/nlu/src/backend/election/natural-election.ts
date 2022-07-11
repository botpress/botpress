import * as sdk from 'botpress/sdk'
import _ from 'lodash'

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

export function electIntent(input: sdk.IO.EventUnderstanding): sdk.IO.EventUnderstanding {
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

export function extractElectedIntentSlot(input: sdk.IO.EventUnderstanding): sdk.IO.EventUnderstanding {
  if (!input.predictions) {
    return input
  }

  const elected = input.intent
  if (_.isNil(elected)) {
    return input
  }

  const electedContext = input.predictions[elected.context]
  if (_.isNil(electedContext)) {
    return input
  }

  const electedIntent = electedContext.intents.find(i => i.label === elected.name)
  if (!electedIntent) {
    return { ...input, slots: {} }
  }
  return { ...input, slots: electedIntent.slots }
}
