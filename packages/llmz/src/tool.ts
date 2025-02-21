import { type JSONSchema, type ZodType, type TypeOf, z } from '@bpinternal/zui'
import { isEmpty, uniq } from 'lodash-es'
import { getTypings as generateTypings } from './typings.js'
import { convertObjectToZuiLiterals, isJsonSchema, isValidIdentifier } from './utils.js'

export class Tool<I extends ZodType | JSONSchema = any, O extends ZodType | JSONSchema = any> {
  private _staticInputValues?: unknown

  public name: string
  public aliases: string[] = []
  public description?: string
  public metadata: Record<string, unknown>
  public input?: JSONSchema
  public output?: JSONSchema

  public setStaticInputValues(values: unknown | undefined): this {
    if (values === null || values === undefined) {
      this._staticInputValues = undefined
      return this
    }

    const input = this.input ? z.fromJsonSchema(this.input) : z.any()

    if (input instanceof z.ZodObject && typeof values !== 'object') {
      throw new Error(
        `Invalid static input values for tool ${this.name}. Expected an object, but got type "${typeof values}"`
      )
    }

    if (input instanceof z.ZodArray && !Array.isArray(values)) {
      throw new Error(
        `Invalid static input values for tool ${this.name}. Expected an array, but got type "${typeof values}"`
      )
    }

    this._staticInputValues = values
    return this
  }

  public get zInput() {
    let input = this.input ? z.fromJsonSchema(this.input) : z.any()

    if (!isEmpty(this._staticInputValues)) {
      const inputExtensions = convertObjectToZuiLiterals(this._staticInputValues)
      if (input instanceof z.ZodObject) {
        input = input.extend(inputExtensions) as typeof input
      } else if (input instanceof z.ZodArray) {
        input = z.array(input.element.extend(inputExtensions))
      } else {
        // if input is z.string() or z.number() etc
        input = inputExtensions as typeof input
      }
    }

    return input
  }

  public get zOutput() {
    return this.output ? z.fromJsonSchema(this.output) : z.void()
  }

  public rename(name: string): this {
    const before = this.name

    if (!isValidIdentifier(name)) {
      throw new Error(
        `Invalid name for tool ${name}. A tool name must start with a letter and contain only letters, numbers, and underscores. It must be 1-50 characters long.`
      )
    }

    this.name = name
    this.aliases = uniq([name, ...this.aliases.map((alias) => (alias === before ? name : alias))])

    return this
  }

  public clone() {
    return <Tool<I, O>>new Tool({
      name: this.name,
      aliases: [...this.aliases],
      description: this.description,
      metadata: JSON.parse(JSON.stringify(this.metadata)),
      input: this.input,
      output: this.output,
      handler: this._handler,
    }).setStaticInputValues(this._staticInputValues)
  }

  private _handler: (args: unknown) => Promise<unknown>

  public constructor(props: {
    name: string
    aliases?: string[]
    description?: string
    metadata?: Record<string, unknown>
    input?: I
    output?: O
    staticInputValues?: unknown
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
    this.setStaticInputValues(props.staticInputValues)
  }

  public async execute(
    input: I extends ZodType ? TypeOf<I> : I extends JSONSchema ? unknown : I
  ): Promise<O extends ZodType ? TypeOf<O> : unknown> {
    const pInput = this.zInput.safeParse(input)

    if (!pInput.success) {
      throw new Error(`Tool "${this.name}" received invalid input: ${pInput.error.message}`)
    }

    const result = (await this._handler(pInput.data)) as any

    const pOutput = this.zOutput.safeParse(result)

    return pOutput.success ? pOutput.data : result
  }

  public async getTypings(): Promise<string> {
    const input = this.input ? z.fromJsonSchema(this.input) : undefined
    const output = this.output ? z.fromJsonSchema(this.output) : z.void()

    const fnType = z
      .function(input as any, z.promise(output))
      .title(this.name)
      .describe(this.description ?? '')

    return generateTypings(fnType, {
      declaration: true,
    })
  }

  public static withUniqueNames = (tools: Tool[]) => {
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

      return tool.rename(toolName)
    })
  }
}
