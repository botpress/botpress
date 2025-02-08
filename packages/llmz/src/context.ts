import { z } from '@bpinternal/zui'

import { ulid } from 'ulid'
import { ObjectDefinition, ObjectInstance } from './objects.js'
import type { OAI } from './openai.js'
import { Oct2024Prompt } from './prompts/oct-2024.js'
import { SnapshotResult } from './snapshots.js'
import { Tool } from './tool.js'
import { TranscriptArray, TranscriptMessage } from './transcript.js'
import { Tokens } from './utils.js'

export type CreateContextProps = Omit<z.input<typeof CreateContextProps>, 'objects'> & {
  objects?: ObjectDefinition[]
}

export const LLMZ_DEFAULT_VERSION = Oct2024Prompt.version

export const CreateContextProps = z.object({
  instructions: Tokens(0, 100_000).optional(),
  objects: z.array(ObjectInstance).min(0).max(100).optional().default([]),
  tools: z.array(z.any()).min(0).max(100).optional().default([]),
  /** TODO: throw MaxLoopReached */
  loop: z.number().min(1).max(100).optional().default(1),
  temperature: z.number().min(0).max(2).optional().default(0.2),
  models: z.record(z.any()).optional(),
  model: z.string().optional().default('openai__gpt-4o-2024-11-20'),
  // participants: z.array(z.string()).optional(),
  transcript: z.array(TranscriptMessage).min(0).max(100).optional().default([]),
  metadata: z.record(z.any()).default({}),
})

export type Context = Awaited<ReturnType<typeof createContext>> & {
  appliedSnapshot?: SnapshotResult
}

export const createContext = (props: CreateContextProps) => {
  const opts = CreateContextProps.parse(props)
  const transcript = new TranscriptArray(...(opts.transcript ?? []))

  // These are the variables that will be injected into the VM, mainly for partial execution when the VM calls `think`
  // This is a way to pass data between iterations
  const injectedVariables: Record<string, any> = {}

  const tool_names: Array<{
    object?: string
    name: string
  }> = []

  const version = Oct2024Prompt

  for (const obj of opts.objects) {
    obj.tools = Tool.withUniqueNames(obj.tools)
    tool_names.push(...obj.tools.map((tool) => ({ object: obj.name, name: tool.name })))
  }

  opts.tools = Tool.withUniqueNames(opts.tools)
  for (const tool of opts.tools) {
    tool_names.push({ name: tool.name })
  }

  const partialExecutionMessages: OAI.Message[] = []

  async function getMessages() {
    const messages: OAI.Message[] = [
      await version.getSystemMessage({
        globalTools: opts.tools,
        objects: opts.objects,
        instructions: opts.instructions,
        transcript,
      }),
    ]

    const shouldAddInitialUserMessage =
      !partialExecutionMessages?.length || partialExecutionMessages[0]?.role !== 'user'
    if (shouldAddInitialUserMessage && !!version.getInitialUserMessage) {
      messages.push(
        await version.getInitialUserMessage({
          globalTools: opts.tools,
          objects: opts.objects,
          instructions: opts.instructions,
          transcript,
        })
      )
    }

    return [...messages, ...partialExecutionMessages]
  }

  return {
    id: `llmz_${ulid()}`,
    __options: opts,
    transcript,
    getMessages,
    partialExecutionMessages,
    tool_names,
    iteration: 0,
    iterations: [],
    injectedVariables,
    version,
    metadata: opts.metadata,
  }
}
