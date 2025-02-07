/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from '@bpinternal/zui'
import { uniq, isEmpty } from 'lodash-es'
import { ExecuteSignal, ListenSignal, ThinkSignal } from './errors.js'
import { Trace } from './types.js'
import { getTypings } from './typings.js'
import { Identifier, convertObjectToZuiLiterals } from './utils.js'

type OutputType = Tools.OutputType
type InputType = Tools.InputType

type ToolDefinition<I extends InputType, O extends OutputType> = {
  name: string
  description?: string
  input?: I
  output?: O
}

const InputType = z.custom<Tools.InputType>((value) => value instanceof z.Schema || value instanceof z.ZodUndefined)

type ToolCtx = {
  // TODO: fix this, "bp" doesn't belong here, IO doesn't belong here
  listen: () => void
  think: (reason: string, context?: any) => void
  executeQueuedSkills: () => void
  // transition: (reason: string, transition: Studio.TransitionCard) => void
  // bp: Botpress
  // event?: IO.IncomingEvent
  traces: Trace[]
}

const ToolDefinition = z.object({
  name: Identifier,
  description: z
    .string()
    .optional()
    .catch(() => undefined),
  metadata: z.record(z.any()).optional(),
  input: InputType.optional(),
  output: z
    .any()
    .or(z.void())
    .default(void 0)
    .optional(),
})

export const makeTool = <
  T extends Tools.Definition<any, any>,
  I extends InputType = T extends Tools.Definition<infer I, never> ? I : never,
  O extends OutputType = T extends Tools.Definition<never, infer O> ? O : OutputType,
>(
  tool: T,
  // tool: Tools.Implementation<I, O>,
  additionalCtx: Partial<ToolCtx> = {}
): Tools.Implementation<I, O> => {
  ToolDefinition.parse(tool)

  const ctx: ToolCtx = {
    traces: [],
    ...additionalCtx,
    listen: () => {
      throw new ListenSignal()
    },
    think: (reason, context) => {
      throw new ThinkSignal(reason, context)
    },
    executeQueuedSkills: () => {
      throw new ExecuteSignal()
    },
  }

  let input = tool.input
  if (!isEmpty((tool as unknown as Tools.Implementation).defaultInputValues)) {
    const inputExtensions = convertObjectToZuiLiterals((tool as unknown as Tools.Implementation).defaultInputValues)
    if (input instanceof z.ZodObject) {
      input = input.extend(inputExtensions) as typeof input
    } else if (input instanceof z.ZodArray) {
      input = z.array(input.element.extend(inputExtensions)) as unknown as I
    } else {
      // if input is z.string() or z.number() etc
      input = inputExtensions as typeof input
    }
  }

  tool.aliases ??= []
  tool.aliases.push(tool.name)
  tool.aliases = uniq(tool.aliases.map((alias) => alias.trim()).filter((alias) => alias.length))

  const result = {
    name: tool.name,
    aliases: tool.aliases,
    description: tool.description,
    metadata: (tool as unknown as Tools.Implementation).metadata,
    input: input as any,
    output: tool.output as any,
    fn: (tool as unknown as Tools.Implementation).fn
      ? (((inputData: z.TypeOf<I>, newCtx: any) => {
          const parsedInput = typeof input?.parse === 'function' ? input.parse(inputData) : inputData
          const result = (tool as unknown as Tools.Implementation).fn!(parsedInput, { ...ctx, ...(newCtx ?? {}) })
          const output = tool.output?.safeParse(result)
          return (output?.success ? output.data : result) as O extends z.ZodAny ? z.TypeOf<O> : void
        }) as any)
      : undefined,
  } satisfies Tools.Implementation<I, O>

  return result
}

export type ToolImplementation = Tools.Definition<InputType, OutputType>
export const ToolImplementation = z.custom<Tools.Definition<InputType, OutputType>>(
  (value: any) => {
    return 'name' in value && 'fn' in value && typeof value.fn === 'function' && typeof value.name === 'string'
  },
  (value: any) => ({
    message: `Invalid tool: "${value?.name ?? value}". Tools must be created using the 'makeTool' function`,
  })
)

export const getToolTypings = async (tool: Tools.Definition<any, any>) => {
  const input = tool.input
  const output = tool.output ?? z.void()

  const fnType = z
    .function(input, output)
    .title(tool.name)
    .describe(tool.description ?? '')

  return getTypings(fnType, {
    declaration: true,
  })
}

export const getToolsWithUniqueNames = (tools: Tools.Implementation[] | Tools.Definition<any, any>[]) => {
  const names = new Set<string>()
  return tools.map((tool) => {
    if (tools.filter((t) => t.name === tool.name).length === 1) {
      // If the name is unique, return the tool as is, no numbers appended
      return tool
    }
    let counter = 1
    let toolName = tool.name + counter
    while (names.has(toolName)) {
      toolName = `${tool.name}${++counter}`
    }
    names.add(toolName)
    return { ...tool, name: toolName }
  })
}

export namespace Tools {
  export type InputType = z.Schema | z.ZodUndefined
  export type OutputType = z.Schema | z.ZodUndefined

  export type Implementation<I extends InputType = InputType, O extends OutputType = OutputType> = {
    name: string
    aliases?: string[]
    description?: string
    input?: I
    output?: O
    metadata?: Record<string, any>
    defaultInputValues?: Record<string, any>
    fn: (
      input: I extends z.ZodType<any> ? z.TypeOf<I> : never,
      ctx: ToolCtx
    ) => O extends z.ZodType<any> ? z.TypeOf<O> : void
  }

  export type Definition<I extends InputType, O extends OutputType> = {
    name: string
    aliases?: string[]
    description?: string
    input?: I
    output?: O
  }
}
