import * as bp from '.botpress'

export type CommonHandlerProps = bp.WorkflowHandlerProps['lintAll'] | bp.EventHandlerProps | bp.MessageHandlerProps

export type WatchedIssue = { id: string; sinceTimestamp: number; commentId?: string }

export type LintResult =
  | {
      identifier: string
      result: 'failed'
      messages: string[]
    }
  | {
      identifier: string
      result: 'succeeded' | 'ignored'
    }
