import * as bp from '.botpress'

export type Result<T> = {
  success: boolean
  message: string
  result?: T
}

export type CommonHandlerProps = bp.WorkflowHandlerProps['lintAll'] | bp.EventHandlerProps | bp.MessageHandlerProps
