import type { CognitiveMessage } from '@botpress/cognitive'
import type { Component } from '../component.js'
import type { Example } from '../example.js'
import type { Exit } from '../exit.js'
import type { ObjectInstance } from '../objects.js'
import type { Tool } from '../tool.js'
import type { TranscriptArray } from '../transcript.js'

export namespace LLMzPrompts {
  export type Message = CognitiveMessage
  export type MessageContent = Exclude<CognitiveMessage['content'], string | null>[number]

  /** System sections used to attribute context usage. Live history is native. */
  export type SystemPromptParts = {
    instructions: string
    /** Callable global functions and object methods; properties live in Memory. */
    tools: string
    /** Empty for native requests. Conversation messages are counted separately. */
    transcript: string
    /** Native execution and completion rules. */
    protocol: string
    examples?: string
  }

  export type SystemMessage = {
    message: Message
    parts: SystemPromptParts
  }

  export type InitialStateProps = {
    isChatEnabled?: boolean
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
}
