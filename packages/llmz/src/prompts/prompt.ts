import { type CognitiveMessage } from '@botpress/cognitive'

import { Component } from '../component.js'
import type { Example } from '../example.js'
import { Exit } from '../exit.js'
import type { Diagnostic, ParsedItem } from '../message-stream/types.js'
import type { ObjectInstance } from '../objects.js'
import { Snapshot } from '../snapshots.js'
import { type Tool } from '../tool.js'
import type { TranscriptArray } from '../transcript.js'

/** A `■send=<component>` block parsed from the assistant response. */
export type ParsedSend = {
  name: string
  props: Record<string, unknown>
  body?: string
}

/** A `■next=<exit>` block parsed from the assistant response. */
export type ParsedNext = {
  name: string
  props: Record<string, unknown>
}

export type ParsedAssistantResponse = {
  raw: string
  /** All protocol items, in order of appearance. */
  items: ParsedItem[]
  /** Syntax diagnostics, including unexpected text discarded outside protocol blocks. */
  diagnostics?: Diagnostic[]
  /** Messages to send to the user, in order. */
  sends: ParsedSend[]
  /** The body of the `■run` block, if any. */
  code?: string
  /** The `■next` exit, if any. */
  next?: ParsedNext
}

export namespace LLMzPrompts {
  export type Message = CognitiveMessage

  /**
   * The raw (pre-truncation, unwrapped) content of each named section of the
   * system prompt. Used to measure the context size of each part of the prompt.
   */
  export type SystemPromptParts = {
    /** The identity / instructions section. */
    instructions: string
    /** tools.d.ts — tools, objects and variable typings. */
    tools: string
    /** The conversation transcript. */
    transcript: string
    /** The ■ protocol reference documenting components and exits. */
    protocol: string
    /** Consumer demonstrations, never live transcript entries. */
    examples?: string
  }

  export type SystemMessage = {
    message: Message
    parts: SystemPromptParts
  }
  export type MessageContent = Extract<CognitiveMessage['content'], any[]>[number]
  export type InitialStateProps = {
    iteration?: {
      current: number
      limit: number
      resumed?: boolean
      history?: string[]
      toolAttempts?: Record<string, number>
      deliveredMessages?: Array<{ iteration: number; content: unknown; retracted?: boolean }>
    }
    instructions?: string
    examples?: Example[]
    transcript: TranscriptArray
    objects: ObjectInstance[]
    globalTools: Tool[]
    exits: Exit[]
    components: Component[]
  }

  export type InvalidCodeProps = {
    isChatEnabled?: boolean
    code: string
    message: string
  }

  export type CodeExecutionErrorProps = {
    isChatEnabled?: boolean
    variables?: unknown
    toolCalls?: unknown
    message: string
    stacktrace: string
  }

  export type ThinkingProps = {
    isChatEnabled?: boolean
    interrupted?: boolean
    reason?: string
    variables: unknown
    /** Messages generated after returning code were suppressed before delivery. */
    discardedMessages?: boolean
  }

  export type SnapshotResolvedProps = {
    snapshot: Snapshot
  }

  export type SnapshotRejectedProps = {
    snapshot: Snapshot
  }
}

export type Prompt = {
  /** Current execution state appended to the final input message, never retained in history. */
  getExecutionState?: (props: LLMzPrompts.InitialStateProps) => string
  getSystemMessage: (props: LLMzPrompts.InitialStateProps) => Promise<LLMzPrompts.SystemMessage>
  getInitialUserMessage: (props: LLMzPrompts.InitialStateProps) => Promise<LLMzPrompts.Message>
  getThinkingMessage: (props: LLMzPrompts.ThinkingProps) => Promise<LLMzPrompts.Message>
  getInvalidCodeMessage: (props: LLMzPrompts.InvalidCodeProps) => Promise<LLMzPrompts.Message>
  getCodeExecutionErrorMessage: (props: LLMzPrompts.CodeExecutionErrorProps) => Promise<LLMzPrompts.Message>
  getSnapshotResolvedMessage: (props: LLMzPrompts.SnapshotResolvedProps) => LLMzPrompts.Message
  getSnapshotRejectedMessage: (props: LLMzPrompts.SnapshotRejectedProps) => LLMzPrompts.Message
  getStopTokens: () => string[]
  parseAssistantResponse: (response: string) => ParsedAssistantResponse
}
