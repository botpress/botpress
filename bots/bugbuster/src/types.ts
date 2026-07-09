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

export type LinearStateType = 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled' | 'duplicate'
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
  state: CommonStateName
  maxTimeSinceLastUpdate: ISO8601Duration
  warningComment: string
  buildWarningReason: (issueIdentifier: string) => string
}

export type LinearTeam = {
  id: string
  key: string
  name: string
  description?: string | undefined
  icon?: string | undefined
}

export type LinearState = {
  id: string
  name: string
  type: LinearStateType
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
