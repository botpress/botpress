import type { CognitiveMessage } from '@botpress/cognitive'
import type { ComponentRegistry } from '../chat/component.js'
import type { ResolvedResponse } from '../chat/response.js'
import type { Exit } from '../exit.js'
import type { ObjectInstance } from '../objects.js'
import type { Tool } from '../tool.js'

export namespace LLMzPrompts {
  export type Message = CognitiveMessage
  export type MessageContent = Exclude<CognitiveMessage['content'], string | null>[number]

  /** System sections used to attribute context usage. */
  export type SystemPromptParts = {
    instructions: string
    tools: string
    protocol: string
  }

  export type SystemMessage = {
    message: Message
    parts: SystemPromptParts
  }

  export type InitialStateProps = {
    isChatEnabled: boolean
    instructions?: string
    response?: ResolvedResponse
    objects: ObjectInstance[]
    globalTools: Tool[]
    exits: Exit[]
    components: ComponentRegistry
  }
}
