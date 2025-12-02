import * as bp from '.botpress'

export type CommonHandlerProps = bp.WorkflowHandlerProps['lintAll'] | bp.EventHandlerProps | bp.MessageHandlerProps

export type LintResult =
  | {
      identifier: string
      result: 'succeeded'
      messages: string[]
    }
  | {
      identifier: string
      result: 'failed' | 'ignored'
    }
