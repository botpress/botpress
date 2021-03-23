import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { detectAmbiguity } from './ambiguous'
import { NONE_INTENT } from './typings'

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
  const mostConfidentCtx = _(input.predictions)
    .pickBy((_p, ctx) => input.includedContexts.includes(ctx))
    .entries()
    .map(([name, ctx]) => ({ ...ctx, name }))
    .maxBy(ctx => ctx.confidence)

  const noneIntent = { label: NONE_INTENT, confidence: mostConfidentCtx.oos, slots: {}, extractor: '' }
  const topTwo: sdk.NLU.Intent[] = _([...mostConfidentCtx.intents, noneIntent])
    .orderBy(i => i.confidence, 'desc')
    .map(({ label, confidence }) => ({ name: label, context: mostConfidentCtx.name, confidence }))
    .take(2)
    .value()

  return {
    ...input,
    intent: topTwo[0],
    intents: topTwo
  }
}

function extractElectedIntentSlot(input: sdk.IO.EventUnderstanding): sdk.IO.EventUnderstanding {
  const elected = input.intent!
  const electedIntent = input.predictions[elected.context].intents.find(i => i.label === elected.name)
  if (!electedIntent) {
    return { ...input, slots: {} }
  }
  return { ...input, slots: electedIntent.slots }
}
