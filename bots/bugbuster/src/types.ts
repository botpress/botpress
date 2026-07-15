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
  | 'IN_PROGRESS'
  | 'STAGING'
  | 'DONE'
  | 'BACKLOG'
  | 'TODO'
  | 'TRIAGE'
  | 'CANCELED'
  | 'BLOCKED'
  | 'STALE'
  | 'DUPLICATE'

export type StateAttributes = {
  commonStateName: CommonStateName
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
