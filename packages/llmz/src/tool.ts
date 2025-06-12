import { TypeOf, z, transforms, ZodObject, ZodType } from '@bpinternal/zui'
import { JSONSchema7 } from 'json-schema'
import { isEmpty, uniq } from 'lodash-es'
import { ZuiType } from './types.js'
import { getTypings as generateTypings } from './typings.js'
import { convertObjectToZuiLiterals, isJsonSchema, isValidIdentifier, isZuiSchema } from './utils.js'

type ToolRetryInput<I> = {
  input: I
  attempt: number
  error?: unknown
}

export type ToolRetryFn<I> = (args: ToolRetryInput<I>) => boolean | Promise<boolean>

type IsObject<T> = T extends object ? (T extends Function ? false : true) : false
type SmartPartial<T> = IsObject<T> extends true ? Partial<T> : T

type ToolCallContext = {
  callId: string
}

export class Tool<I extends ZuiType = ZuiType, O extends ZuiType = ZuiType> {
  private _staticInputValues?: unknown

  public name: string
  public aliases: string[] = []
  public description?: string
  public metadata: Record<string, unknown>
  public input?: JSONSchema7
  public output?: JSONSchema7
  public retry?: ToolRetryFn<TypeOf<I>>

  public MAX_RETRIES = 1000

  public setStaticInputValues(values: SmartPartial<TypeOf<I>>): this {
    if (values === null || values === undefined) {
      this._staticInputValues = undefined
      return this
    }

    const input = this.input ? transforms.fromJSONSchemaLegacy(this.input) : z.any()

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
    let input = this.input ? transforms.fromJSONSchemaLegacy(this.input) : z.any()

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
    return this.output ? transforms.fromJSONSchemaLegacy(this.output) : z.void()
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

  public clone<IX extends ZuiType = I, OX extends ZuiType = O>(
    props: Partial<{
      name: string
      aliases?: string[]
      description?: string
      metadata?: Record<string, unknown>
      input: IX | ((original: I | undefined) => IX)
      output: OX | ((original: O | undefined) => OX)
      staticInputValues?: SmartPartial<TypeOf<IX>>
      handler: (args: TypeOf<IX>, ctx: ToolCallContext) => Promise<TypeOf<OX>>
      retry: ToolRetryFn<TypeOf<IX>>
    }> = {}
  ): Tool<IX, OX> {
    try {
      const zInput = this.input ? (transforms.fromJSONSchemaLegacy(this.input) as unknown as I) : undefined
      const zOutput = this.output ? (transforms.fromJSONSchemaLegacy(this.output) as unknown as O) : undefined

      return <Tool<IX, OX>>new Tool({
        name: props.name ?? this.name,
        aliases: props.aliases ?? [...this.aliases],
        description: props.description ?? this.description,
        metadata: JSON.parse(JSON.stringify(props.metadata ?? this.metadata)),
        input:
          typeof props.input === 'function'
            ? props.input?.(zInput)
            : props.input instanceof ZodType
              ? props.input
              : (zInput as unknown as IX),
        output:
          typeof props.output === 'function'
            ? props.output?.(zOutput)
            : props.output instanceof ZodType
              ? props.output
              : (zOutput as unknown as OX),
        handler: (props.handler ?? this._handler) as (args: TypeOf<IX>, ctx: ToolCallContext) => Promise<TypeOf<OX>>,
        retry: props.retry ?? this.retry,
      }).setStaticInputValues((props.staticInputValues as any) ?? (this._staticInputValues as any))
    } catch (e) {
      throw new Error(`Failed to clone tool "${this.name}": ${e}`)
    }
  }

  private _handler: (args: unknown, ctx: ToolCallContext) => Promise<unknown>

  public constructor(props: {
    name: string
    aliases?: string[]
    description?: string
    metadata?: Record<string, unknown>
    input?: I
    output?: O
    staticInputValues?: Partial<TypeOf<I>>
    handler: (args: TypeOf<I>, ctx: ToolCallContext) => Promise<TypeOf<O>>
    retry?: ToolRetryFn<TypeOf<I>>
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
      if (isZuiSchema(props.input)) {
        this.input = transforms.toJSONSchemaLegacy(props.input)
      } else if (isJsonSchema(props.input)) {
        this.input = props.input
      } else {
        throw new Error(
          `Invalid input schema for tool ${props.name}. Expected a ZodType or JSONSchema, but got type "${typeof props.input}"`
        )
      }
    }

    if (typeof props.output !== 'undefined') {
      if (isZuiSchema(props.output)) {
        this.output = transforms.toJSONSchemaLegacy(props.output)
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
    this.setStaticInputValues(props.staticInputValues as any)
    this.retry = props.retry
  }

  public async execute(input: TypeOf<I>, ctx: ToolCallContext): Promise<TypeOf<O>> {
    const pInput = this.zInput.safeParse(input)

    if (!pInput.success) {
      throw new Error(`Tool "${this.name}" received invalid input: ${pInput.error.message}`)
    }

    let attempt = 0

    while (attempt < this.MAX_RETRIES) {
      try {
        const result = (await this._handler(pInput.data, ctx)) as any
        const pOutput = this.zOutput.safeParse(result)
        return pOutput.success ? pOutput.data : result
      } catch (err) {
        const shouldRetry = await this.retry?.({
          input: pInput.data,
          attempt: ++attempt,
          error: err,
        })

        if (!shouldRetry) {
          throw err
        }
      }
    }

    throw new Error(
      `Tool "${this.name}" failed after ${this.MAX_RETRIES} attempts. Last error: ${JSON.stringify(input)}`
    )
  }

  public async getTypings(): Promise<string> {
    let input = this.input ? transforms.fromJSONSchemaLegacy(this.input) : undefined
    const output = this.output ? transforms.fromJSONSchemaLegacy(this.output) : z.void()

    if (
      input?.naked() instanceof ZodObject &&
      typeof this._staticInputValues === 'object' &&
      !isEmpty(this._staticInputValues)
    ) {
      // If input is an object and static values are set, extend the input with those values
      const inputExtensions = convertObjectToZuiLiterals(this._staticInputValues)
      input = (input as ZodObject).extend(inputExtensions)
    } else if (this._staticInputValues !== undefined) {
      input = convertObjectToZuiLiterals(this._staticInputValues) as typeof input
    }

    const fnType = z
      .function(input as any, z.promise(output))
      .title(this.name)
      .describe(this.description ?? '')

    return generateTypings(fnType, {
      declaration: true,
    })
  }

  public static withUniqueNames = (tools: Tool<any, any>[]) => {
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
