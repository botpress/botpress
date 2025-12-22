import * as bp from '.botpress'

export type CommonHandlerProps = bp.WorkflowHandlerProps['lintAll'] | bp.EventHandlerProps | bp.MessageHandlerProps

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

const STATE_KEYS = [
  'IN_PROGRESS',
  'STAGING',
  'PRODUCTION_DONE',
  'BACKLOG',
  'TODO',
  'TRIAGE',
  'CANCELED',
  'BLOCKED',
  'STALE',
] as const
export type StateKey = (typeof STATE_KEYS)[number]

export type StateAttributes = {
  stateKey: StateKey
  maxTimeSinceLastUpdate: ISO8601Duration
  warningComment: string
  buildWarningReason: (issueIdentifier: string) => string
}

export type ISO8601Duration = string

type CommandResult = { success: boolean; message: string }
export type CommandImplementation = (args: string[], conversationId: string) => CommandResult | Promise<CommandResult>
export type CommandDefinition = {
  name: string
  requiredArgs?: string[]
  optionalArgs?: string[]
  implementation: CommandImplementation
}
