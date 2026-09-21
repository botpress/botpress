import type { Iteration } from '../context.js'
import { HookError, isCriticalError } from '../errors.js'
import type { ExecutionHooks } from './types.js'

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
    if (isCriticalError(err)) {
      iteration.recordError(err)
      throw err
    }

    iteration.recordError(new HookError(err instanceof Error ? err.message : String(err), { cause: err }))
    console.error(err)
  }
}
