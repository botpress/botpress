import { type Cognitive } from '@botpress/cognitive'
import { ulid } from 'ulid'
import { ObjectInstance } from './objects.js'
import type { OAI } from './openai.js'
import { Oct2024Prompt } from './prompts/oct-2024.js'
import { SnapshotResult } from './snapshots.js'
import { Tool } from './tool.js'
import { TranscriptArray, TranscriptMessage } from './transcript.js'
import { Iteration } from './types.js'

type Model = Parameters<InstanceType<typeof Cognitive>['generateContent']>[0]['model']

export type Context = Awaited<ReturnType<typeof createContext>> & {
  appliedSnapshot?: SnapshotResult
}

export const createContext = (props: {
  instructions?: string
  objects?: ObjectInstance[]
  tools?: Tool[]
  loop?: number
  temperature?: number
  model?: Model
  transcript?: TranscriptMessage[]
  metadata?: Record<string, any>
}) => {
  const transcript = new TranscriptArray(Array.isArray(props.transcript) ? props.transcript : [])
  let tools = Tool.withUniqueNames(props.tools ?? [])
  const objects = props.objects ?? []
  const loop = props.loop ?? 1
  const temperature = props.temperature ?? 0.7
  const iterations: Iteration[] = []

  if (objects && objects.length > 100) {
    throw new Error('Too many objects. Expected at most 100 objects.')
  }

  if (tools && tools.length > 100) {
    throw new Error('Too many tools. Expected at most 100 tools.')
  }

  if (props.instructions && props.instructions.length > 1_000_000) {
    throw new Error('Instructions are too long. Expected at most 1,000,000 characters.')
  }

  if (props.transcript && props.transcript.length > 250) {
    throw new Error('Too many transcript messages. Expected at most 250 messages.')
  }

  if (loop < 1 || loop > 100) {
    throw new Error('Invalid loop. Expected a number between 1 and 100.')
  }

  if (temperature < 0 || temperature > 2) {
    throw new Error('Invalid temperature. Expected a number between 0 and 2.')
  }

  // These are the variables that will be injected into the VM, mainly for partial execution when the VM calls `think`
  // This is a way to pass data between iterations
  const injectedVariables: Record<string, any> = {}

  const tool_names: Array<{
    object?: string
    name: string
  }> = []

  const version = Oct2024Prompt

  for (const obj of objects) {
    tools = Tool.withUniqueNames(tools)
    tool_names.push(...tools.map((tool) => ({ object: obj.name, name: tool.name })))
  }

  for (const tool of tools) {
    tool_names.push({ name: tool.name })
  }

  const partialExecutionMessages: OAI.Message[] = []

  async function getMessages() {
    const messages: OAI.Message[] = [
      await version.getSystemMessage({
        globalTools: tools,
        objects,
        instructions: props.instructions ?? '',
        transcript,
      }),
    ]

    const shouldAddInitialUserMessage =
      !partialExecutionMessages?.length || partialExecutionMessages[0]?.role !== 'user'
    if (shouldAddInitialUserMessage && !!version.getInitialUserMessage) {
      messages.push(
        await version.getInitialUserMessage({
          globalTools: props.tools ?? [],
          objects,
          instructions: props.instructions,
          transcript,
        })
      )
    }

    return [...messages, ...partialExecutionMessages]
  }

  return {
    id: `llmz_${ulid()}`,
    transcript,
    getMessages,
    partialExecutionMessages,
    tool_names,
    iteration: 0,
    iterations,
    injectedVariables,
    version,
    metadata: props.metadata,
    model: props.model,
    loop,
    temperature,
    tools,
    objects,
  }
}
