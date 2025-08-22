import { getContext, saveContext } from './context'
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

  await saveContext({
    client: context.client,
    context: context.state,
    workflowId: context.workflow.id,
  })

  return output
}

step.map = async <T, U>(
  name: string,
  items: T[],
  run: (input: T, opts: { i: number }) => Promise<U>,
  { maxAttempts = 3 }: { maxAttempts?: number } = {}
) => {
  const context = getContext()

  if (context.aborted) {
    throw new AbortError()
  }

  if (context.state.steps[name]?.output !== undefined) {
    return context.state.steps[name].output as U[]
  }

  const stepContext = context.state.steps[name] ?? { i: 0, attempts: 0, output: undefined, steps: {} }

  if (!context.state.steps[name]) {
    context.state.steps[name] = stepContext
  }

  for (let i = stepContext.i ?? 0; i < items.length; i++) {
    if (context.aborted) {
      throw new AbortError()
    }

    try {
      const item = items[i]! // This item is guaranteed to be defined because we check the length above
      const output = await run(item, { i })
      stepContext.i = i + 1
      stepContext.attempts = 0
      stepContext.steps![`${i}`] = { output, attempts: 0 }
    } catch (e) {
      stepContext.attempts++
      throw new FailedError(`Step "${name}" failed on item ${i} after ${maxAttempts} attempts`)
    }

    await saveContext({
      client: context.client,
      context: context.state,
      workflowId: context.workflow.id,
    })
  }

  stepContext.output = Object.values(stepContext.steps ?? {}).map((s) => s.output)
  stepContext.steps = undefined

  await saveContext({
    client: context.client,
    context: context.state,
    workflowId: context.workflow.id,
  })

  return stepContext.output as U[]
}

export type Step = typeof step
