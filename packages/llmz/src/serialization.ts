import { Context as ContextClass, Iteration as IterationClass } from './context.js'
import { Exit as ExitClass } from './exit.js'
import { ObjectInstance as ObjectInstanceClass } from './objects.js'
import {
  ErrorExecutionResult as ErrorExecutionResultClass,
  PartialExecutionResult as PartialExecutionResultClass,
  SuccessExecutionResult as SuccessExecutionResultClass,
} from './result.js'
import { Snapshot as SnapshotClass } from './snapshots.js'
import { Tool as ToolClass } from './tool.js'

export namespace Serialized {
  export type Tool = ReturnType<ToolClass['toJSON']>
  export type ObjectInstance = ReturnType<ObjectInstanceClass['toJSON']>
  export type Exit = ReturnType<ExitClass['toJSON']>
  export type Context = ReturnType<ContextClass['toJSON']>
  export type Iteration = ReturnType<IterationClass['toJSON']>
  export type Snapshot = ReturnType<SnapshotClass['toJSON']>

  export type SuccessExecutionResult = ReturnType<SuccessExecutionResultClass['toJSON']>
  export type ErrorExecutionResult = ReturnType<ErrorExecutionResultClass['toJSON']>
  export type PartialExecutionResult = ReturnType<PartialExecutionResultClass['toJSON']>

  export type ExecutionResult = SuccessExecutionResult | ErrorExecutionResult | PartialExecutionResult
}
