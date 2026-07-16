import { Client } from '@botpress/client'
import { Cognitive, CognitiveBeta, cognitiveFromBeta, type BotpressClientLike } from '@botpress/cognitive'

import type { Iteration } from '../context.js'
import { _CustomModelClient } from '../custom-client.js'
import type { ExecutionHooks, ExecutionProps, RuntimeCognitive } from './types.js'

/**
 * Resolves the `client` execution prop into a {@link RuntimeCognitive} instance.
 * Falls back to a default {@link Client} when none is provided, and adapts
 * Botpress/Beta clients into a Cognitive client as needed.
 */
export const initCognitiveClient = (client: ExecutionProps['client']): RuntimeCognitive => {
  const resolved = client ?? new Client()

  return Cognitive.isCognitiveClient(resolved) || _CustomModelClient.isCustomClient(resolved)
    ? resolved
    : CognitiveBeta.isBetaClient(resolved)
      ? cognitiveFromBeta(resolved)
      : new Cognitive({ client: resolved as BotpressClientLike, __experimental_beta: true })
}

type FinalizeIterationProps = {
  iteration: Iteration
  status?: Parameters<Iteration['end']>[0]
  controller: AbortController
  onIterationEnd?: ExecutionHooks['onIterationEnd']
}

export const finalizeIteration = async ({ iteration, status, controller, onIterationEnd }: FinalizeIterationProps) => {
  if (status) {
    iteration.end(status)
  }

  if (iteration.status.type === 'pending') {
    return
  }

  try {
    await onIterationEnd?.(iteration, controller)
  } catch (err) {
    console.error(err)
  }
}
