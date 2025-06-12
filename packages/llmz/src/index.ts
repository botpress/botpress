export { Tool } from './tool.js'
export { Exit, ExitResult } from './exit.js'
export { ObjectInstance } from './objects.js'
export { SnapshotSignal, ThinkSignal, LoopExceededError } from './errors.js'

export {
  Component,
  RenderedComponent,
  LeafComponentDefinition,
  ContainerComponentDefinition,
  DefaultComponentDefinition,
  ComponentDefinition,
  assertValidComponent,
  isComponent,
  isAnyComponent,
} from './component.js'

export { Citation, CitationsManager } from './citations.js'
export { DefaultComponents } from './component.default.js'
export { Snapshot } from './snapshots.js'
export { Chat, type MessageHandler } from './chat.js'

import { type ExecutionProps } from './llmz.js'
import { ExecutionResult } from './result.js'
export { ErrorExecutionResult, ExecutionResult, PartialExecutionResult, SuccessExecutionResult } from './result.js'
export { Trace } from './types.js'
export { type Iteration, ListenExit, ThinkExit, DefaultExit, IterationStatuses, IterationStatus } from './context.js'

export { type ValueOrGetter, getValue } from './getter.js'

export const execute = async (props: ExecutionProps) => {
  // Code splitting to improve import performance
  const { executeContext } = await import('./llmz.js')
  return executeContext(props) as Promise<ExecutionResult>
}

/**
 * Loads the necessary dependencies for the library to work
 * Calling this function is optional, but it will improve the performance of the first call to `executeContext`
 * It's recommended to call this function at the beginning of your application without awaiting it (void init())
 */
export const init = async () => {
  await import('./llmz.js')
  await import('./component.js')
  await import('./tool.js')
  await import('./exit.js')
  await import('./jsx.js')
  await import('./vm.js')
  await import('./utils.js')
  await import('./truncator.js')
  await import('./typings.js')
  await import('./prompts/dual-modes.js')
}
