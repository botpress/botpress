import * as lin from './utils/linear-utils'
import * as bp from '.botpress'

export type CommonHandlerProps = bp.WorkflowHandlerProps['lintAll'] | bp.EventHandlerProps | bp.MessageHandlerProps

export type WatchedIssue = { id: string; commentId: string }

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

export type StateAttributes = {
  stateKey: lin.StateKey
  maxTimeSinceLastUpdate: ISO8601Duration
  warningComment: string
  warningReason: string
}

export type ISO8601Duration = string
