import { getContext, saveState } from './context'
import { AbortError, FailedError } from './error'

export const step = async <T>(
  name: string,
  run: () => Promise<T>,
  { maxAttempts = 3 }: { maxAttempts?: number } = {}
) => {
  const context = getContext()

  if (context.aborted) {
    throw new AbortError()
  }

  if (context.state.steps[name]?.output !== undefined) {
    return context.state.steps[name].output as T
  }

  let output: T

  try {
    output = await run()
  } catch (e) {
    if ((context.state.steps[name]?.attempts ?? 0) + 1 >= maxAttempts) {
      throw new FailedError(`Step "${name}" failed after ${maxAttempts} attempts`)
    }

    throw e
  }

  context.state.steps[name] = { output: output ?? null, attempts: 0 }

  await saveState({
    client: context.client,
    state: context.state,
    workflowId: context.workflow.id,
  })

  return output
}

export type Step = typeof step
