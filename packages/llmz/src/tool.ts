import { type JSONSchema, type ZodType, type TypeOf, z } from '@bpinternal/zui'
import { uniq } from 'lodash-es'
import { getTypings as generateTypings } from './typings.js'

export class Tool<I extends ZodType | JSONSchema, O extends ZodType | JSONSchema> {
  public name: string
  public aliases: string[] = []
  public description?: string
  public metadata: Record<string, unknown>
  public input?: JSONSchema
  public output?: JSONSchema

  private _handler: (args: unknown) => Promise<unknown>

  public constructor(props: {
    name: string
    aliases?: string[]
    description?: string
    metadata?: Record<string, unknown>
    input?: I
    output?: O
    handler: (
      args: I extends ZodType ? TypeOf<I> : I extends JSONSchema ? unknown : I
    ) => O extends ZodType ? Promise<TypeOf<O>> : O extends JSONSchema ? Promise<unknown> : O
  }) {
    if (!isValidIdentifier(props.name)) {
      throw new Error(
        `Invalid name for tool ${props.name}. A tool name must start with a letter and contain only letters, numbers, and underscores. It must be 1-50 characters long.`
      )
    }

    if (props.description !== undefined && typeof props.description !== 'string') {
      throw new Error(
        `Invalid description for tool ${props.name}. Expected a string, but got type "${typeof props.description}"`
      )
    }

    if (props.metadata !== undefined && typeof props.metadata !== 'object') {
      throw new Error(
        `Invalid metadata for tool ${props.name}. Expected an object, but got type "${typeof props.metadata}"`
      )
    }

    if (typeof props.handler !== 'function') {
      throw new Error(
        `Invalid handler for tool ${props.name}. Expected a function, but got type "${typeof props.handler}"`
      )
    }

    if (props.aliases !== undefined && !Array.isArray(props.aliases)) {
      throw new Error(
        `Invalid aliases for tool ${props.name}. Expected an array, but got type "${typeof props.aliases}"`
      )
    }

    if (props.aliases && props.aliases.some((alias) => !isValidIdentifier(alias))) {
      throw new Error(`Invalid aliases for tool ${props.name}. Expected an array of valid identifiers.`)
    }

    if (typeof props.input !== 'undefined') {
      if (props.input && 'toJsonSchema' in props.input && typeof props.input.toJsonSchema === 'function') {
        this.input = props.input.toJsonSchema()
      } else if (isJsonSchema(props.input)) {
        this.input = props.input
      } else {
        throw new Error(
          `Invalid input schema for tool ${props.name}. Expected a ZodType or JSONSchema, but got type "${typeof props.input}"`
        )
      }
    }

    if (typeof props.output !== 'undefined') {
      if (props.output && 'toJsonSchema' in props.output && typeof props.output.toJsonSchema === 'function') {
        this.output = props.output.toJsonSchema()
      } else if (isJsonSchema(props.output)) {
        this.output = props.output
      } else {
        throw new Error(
          `Invalid output schema for tool ${props.name}. Expected a ZodType or JSONSchema, but got type "${typeof props.output}"`
        )
      }
    }

    this.name = props.name
    this.aliases = uniq([props.name, ...(props.aliases ?? [])])
    this.description = props.description
    this.metadata = props.metadata ?? {}
    this._handler = props.handler as any
  }

  public async execute(input: unknown[]): Promise<unknown> {
    return this._handler(input)
  }

  public async getTypings(): Promise<string> {
    const input = this.input ? z.fromJsonSchema(this.input) : z.unknown()
    const output = this.output ? z.fromJsonSchema(this.output) : z.void()

    const fnType = z
      .function(input as any, output)
      .title(this.name)
      .describe(this.description ?? '')

    return generateTypings(fnType, {
      declaration: true,
    })
  }
}

function isJsonSchema(schema: unknown): schema is JSONSchema {
  return !!schema && typeof schema === 'object' && ('$schema' in schema || 'type' in schema || 'properties' in schema)
}

function isValidIdentifier(name: string): boolean {
  if (typeof name !== 'string') {
    return false
  }

  return /^[A-Z]{1,}[A-Z0_9_]{0,50}$/i.test(name)
}
