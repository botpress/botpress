import { getContext, saveState } from './context'

export const step = async <T>(name: string, run: () => Promise<T>) => {
  const context = getContext()

  if (context.state.steps[name] !== undefined) {
    return context.state.steps[name] as T
  }

  const output = await run()

  context.state.steps[name] = output ?? null

  await saveState({
    client: context.client,
    state: context.state,
    workflowId: context.workflow.id,
  })

  return output
}
