import { IO, NLU } from 'botpress/sdk'
import _ from 'lodash'

export const getMostConfidentContext = (
  nlu: IO.EventUnderstanding
): (NLU.ContextPrediction & { name: string }) | undefined => {
  if (!nlu.predictions) {
    return undefined
  }

  const allContexts = Object.keys(nlu.predictions)
  const { includedContexts } = nlu
  const availableContexts = _.intersection(includedContexts, allContexts).length ? includedContexts : allContexts

  return _(nlu.predictions)
    .pickBy((_p, ctx) => availableContexts.includes(ctx))
    .entries()
    .map(([name, ctx]) => ({ ...ctx, name }))
    .maxBy(ctx => ctx.confidence)
}
