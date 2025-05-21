import { Component } from 'src/component.js'
import { Exit } from 'src/exit.js'
import type { ObjectInstance } from '../objects.js'
import { OAI } from '../openai.js'
import { RejectCallback, ResolveCallback, SnapshotResult } from '../snapshots.js'
import { type Tool } from '../tool.js'
import type { TranscriptArray } from '../transcript.js'

export namespace LLMzPrompts {
  export type InitialStateProps = {
    instructions?: string
    transcript: TranscriptArray
    objects: ObjectInstance[]
    globalTools: Tool[]
    exits: Exit[]
    components: Component[]
  }

  export type InvalidCodeProps = {
    code: string
    message: string
  }

  export type CodeExecutionErrorProps = {
    message: string
    stacktrace: string
  }

  export type ThinkingProps = {
    reason?: string
    variables: unknown
  }

  export type SnapshotResolvedProps = {
    result: SnapshotResult<ResolveCallback>
    injectedVariables: Record<string, unknown>
  }

  export type SnapshotRejectedProps = {
    result: SnapshotResult<RejectCallback>
  }
}

export type Prompt = {
  getSystemMessage: (props: LLMzPrompts.InitialStateProps) => Promise<OAI.Message>
  getInitialUserMessage: (props: LLMzPrompts.InitialStateProps) => Promise<OAI.Message>
  getThinkingMessage: (props: LLMzPrompts.ThinkingProps) => Promise<OAI.Message>
  getInvalidCodeMessage: (props: LLMzPrompts.InvalidCodeProps) => Promise<OAI.Message>
  getCodeExecutionErrorMessage: (props: LLMzPrompts.CodeExecutionErrorProps) => Promise<OAI.Message>
  getSnapshotResolvedMessage: (props: LLMzPrompts.SnapshotResolvedProps) => OAI.Message
  getSnapshotRejectedMessage: (props: LLMzPrompts.SnapshotRejectedProps) => OAI.Message
  getStopTokens: () => string[]
  parseAssistantResponse: (response: string) => { type: 'code'; raw: string; code: string }
}
