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
  const topTwo: sdk.NLU.Intent[] = _(input.predictions)
    .pickBy((_p, ctx) => input.includedContexts.includes(ctx))
    .mapValues((p, ctx) => {
      const noneIntent = {
        label: NONE_INTENT,
        confidence: p.oos,
        slots: <sdk.NLU.SlotCollection>{},
        extractor: ''
      }
      return {
        ...p,
        ctx,
        intents: [...p.intents, noneIntent]
      }
    })
    .flatMap(p => p.intents.map(i => ({ ...i, ctxConf: p.confidence, ctx: p.ctx })))
    .orderBy(i => i.confidence * i.ctxConf, 'desc')
    .map(i => ({ name: i.label, confidence: i.confidence * i.ctxConf, context: i.ctx }))
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
