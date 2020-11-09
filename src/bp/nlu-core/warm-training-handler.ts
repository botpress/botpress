import crypto from 'crypto'
import _ from 'lodash'

import { TrainOutput } from './training-pipeline'
import { Intent } from './typings'

interface ContextChangeLog {
  createdContexts: string[]
  deletedContexts: string[]
  modifiedContexts: string[]
}

export const getModifiedContexts = (
  currentIntents: Intent<string>[],
  previousIntents: Intent<string>[]
): ContextChangeLog => {
  const ctx = (i: Intent<string>) => i.contexts

  const currentContexts = _.flatten(currentIntents.map(ctx))
  const previousContexts = _.flatten(previousIntents.map(ctx))

  const createdContexts = currentContexts.filter(c => !previousContexts.includes(c))
  const deletedContexts = previousContexts.filter(c => !currentContexts.includes(c))

  const allContexts = _.uniq([...currentContexts, ...previousContexts])
  const alreadyExistingContexts = allContexts.filter(c => !createdContexts.includes(c) && !deletedContexts.includes(c))

  const changeDetector = _ctxHasChanged(currentIntents, previousIntents)
  const modifiedContexts: string[] = alreadyExistingContexts.filter(changeDetector)

  return {
    createdContexts,
    deletedContexts,
    modifiedContexts
  }
}

const _ctxHasChanged = (currentIntents: Intent<string>[], previousIntents: Intent<string>[]) => (ctx: string) => {
  const prevHash = _computeCtxHash(previousIntents, ctx)
  const currHash = _computeCtxHash(currentIntents, ctx)
  return prevHash !== currHash
}

const _computeCtxHash = (intents: Intent<string>[], ctx: string) => {
  const intentsOfCtx = intents.filter(i => i.contexts.includes(ctx))
  const informationToTrack = intentsOfCtx.map(i => ({
    name: i.name,
    slot_definitions: i.slot_definitions,
    utterances: i.utterances,
    vocab: i.vocab,
    slot_entities: i.slot_entities
  }))

  return crypto
    .createHash('md5')
    .update(JSON.stringify(informationToTrack))
    .digest('hex')
}

export const mergeModelOutputs = (
  currentOutput: TrainOutput,
  previousOutput: TrainOutput,
  contexts: string[]
): TrainOutput => {
  const output = { ...currentOutput }

  const previousIntents = _.pick(previousOutput.intent_model_by_ctx, contexts)
  const previousOOS = _.pick(previousOutput.oos_model, contexts)

  output.intent_model_by_ctx = { ...previousIntents, ...currentOutput.intent_model_by_ctx }
  output.oos_model = { ...previousOOS, ...currentOutput.oos_model }
  return output
}
