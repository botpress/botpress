import { CodeExecutionError, InvalidCodeError, ThinkSignal } from '../errors.js'
import type { ObjectInstance } from '../objects.js'
import { OAI } from '../openai.js'
import { RejectCallback, ResolveCallback, SnapshotResult } from '../snapshots.js'
import type { ToolImplementation } from '../tools.js'
import type { TranscriptArray } from '../transcript.js'

export namespace LLMzPrompts {
  export type InitialStateProps = {
    instructions?: string
    transcript: TranscriptArray
    objects: ObjectInstance[]
    globalTools: ToolImplementation[]
  }

  export type InvalidCodeProps = {
    error: InvalidCodeError
  }

  export type FeedbackProps = {
    feedback: string
  }

  export type CodeExecutionErrorProps = {
    error: CodeExecutionError
  }

  export type ThinkingProps = {
    signal: ThinkSignal
  }

  export type SnapshotResolvedProps = {
    result: SnapshotResult<ResolveCallback>
    injectedVariables: Record<string, unknown>
  }

  export type SnapshotRejectedProps = {
    result: SnapshotResult<RejectCallback>
  }
}

export type PromptVersion<T extends string = string> = {
  version: T
  status: 'stable' | 'beta'
  description: string
  disclaimer?: string
  displayName: string
  getSystemMessage: (props: LLMzPrompts.InitialStateProps) => Promise<OAI.Message>
  getInitialUserMessage?: (props: LLMzPrompts.InitialStateProps) => Promise<OAI.Message>
  getThinkingMessage: (props: LLMzPrompts.ThinkingProps) => Promise<OAI.Message>
  getInvalidCodeMessage: (props: LLMzPrompts.InvalidCodeProps) => Promise<OAI.Message>
  getFeedbackMessage: (props: LLMzPrompts.FeedbackProps) => Promise<OAI.Message<'user'>>
  getCodeExecutionErrorMessage: (props: LLMzPrompts.CodeExecutionErrorProps) => Promise<OAI.Message>
  getSnapshotResolvedMessage: (props: LLMzPrompts.SnapshotResolvedProps) => OAI.Message
  getSnapshotRejectedMessage: (props: LLMzPrompts.SnapshotRejectedProps) => OAI.Message
  getStopTokens: () => string[]
  parseAssistantResponse: (
    response: string
  ) => { type: 'markdown'; raw: string; markdown: string } | { type: 'code'; raw: string; code: string }
}

export type PromptVersionMeta = Pick<PromptVersion, 'version' | 'status' | 'description' | 'displayName' | 'disclaimer'>
