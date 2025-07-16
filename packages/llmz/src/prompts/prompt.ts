import { type GenerateContentInput } from '@botpress/cognitive'

import { Component } from 'src/component.js'
import { Exit } from 'src/exit.js'
import type { ObjectInstance } from '../objects.js'
import { Snapshot } from '../snapshots.js'
import { type Tool } from '../tool.js'
import type { TranscriptArray } from '../transcript.js'

export namespace LLMzPrompts {
  export type Message = GenerateContentInput['messages'][number] | { role: 'system'; content: string }
  export type MessageContent = Extract<GenerateContentInput['messages'][number]['content'], any[]>[number]
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
    snapshot: Snapshot
  }

  export type SnapshotRejectedProps = {
    snapshot: Snapshot
  }
}

export type Prompt = {
  getSystemMessage: (props: LLMzPrompts.InitialStateProps) => Promise<LLMzPrompts.Message>
  getInitialUserMessage: (props: LLMzPrompts.InitialStateProps) => Promise<LLMzPrompts.Message>
  getThinkingMessage: (props: LLMzPrompts.ThinkingProps) => Promise<LLMzPrompts.Message>
  getInvalidCodeMessage: (props: LLMzPrompts.InvalidCodeProps) => Promise<LLMzPrompts.Message>
  getCodeExecutionErrorMessage: (props: LLMzPrompts.CodeExecutionErrorProps) => Promise<LLMzPrompts.Message>
  getSnapshotResolvedMessage: (props: LLMzPrompts.SnapshotResolvedProps) => LLMzPrompts.Message
  getSnapshotRejectedMessage: (props: LLMzPrompts.SnapshotRejectedProps) => LLMzPrompts.Message
  getStopTokens: () => string[]
  parseAssistantResponse: (response: string) => { type: 'code'; raw: string; code: string }
}
