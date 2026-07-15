import * as lin from './utils/linear-utils'

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

export type CommonStateName =
  | 'TRIAGE'
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'IN_REVIEW'
  | 'STAGING'
  | 'MONITORING'
  | 'DONE'
  | 'CANCELED'
  | 'STALE'
  | 'DUPLICATE'

export type StateEntry = lin.State & {
  commonName?: CommonStateName
}

export type StatePredicate = (state: StateEntry) => boolean
export type StateAttributes = {
  filter: StatePredicate
  maxTimeSinceLastUpdate: lin.ISO8601Duration
  warningComment: string
  buildWarningReason: (issueIdentifier: string) => string
}

export type CommentType = 'lint' | 'stale'

type CommandResult = { success: boolean; message: string }
export type CommandImplementation = (args: string[], conversationId: string) => CommandResult | Promise<CommandResult>
export type CommandDefinition = {
  name: string
  requiredArgs?: string[]
  optionalArgs?: string[]
  implementation: CommandImplementation
}
