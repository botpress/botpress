import { IO, NLU } from 'botpress/sdk'
import _ from 'lodash'

export const getMostConfidentContext = (
  nluEvent: IO.EventUnderstanding
): (NLU.ContextPrediction & { name: string }) | undefined => {
  if (!nluEvent.predictions) {
    return undefined
  }

  const allContexts = Object.keys(nluEvent.predictions)
  const { includedContexts } = nluEvent
  const availableContexts = _.intersection(includedContexts, allContexts).length ? includedContexts : allContexts

  return _(nluEvent.predictions)
    .pickBy((_p, ctx) => availableContexts.includes(ctx))
    .entries()
    .map(([name, ctx]) => ({ ...ctx, name }))
    .maxBy(ctx => ctx.confidence)
}
