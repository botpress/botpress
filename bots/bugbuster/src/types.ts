import * as bp from '.botpress'

export type CommonHandlerProps = bp.WorkflowHandlerProps['lintAll'] | bp.EventHandlerProps | bp.MessageHandlerProps

export type WatchedIssue = { id: string; sinceTimestamp: number; commentId?: string }
