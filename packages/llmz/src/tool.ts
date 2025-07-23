import { TypeOf, z, transforms, ZodObject, ZodType } from '@bpinternal/zui'
import { JSONSchema7 } from 'json-schema'
import { isEmpty, uniq } from 'lodash-es'
import { Serializable, ZuiType } from './types.js'
import { getTypings as generateTypings } from './typings.js'
import { convertObjectToZuiLiterals, isJsonSchema, isValidIdentifier, isZuiSchema } from './utils.js'

/**
 * Input parameters passed to tool retry functions.
 *
 * @template I - The input type for the tool
 */
type ToolRetryInput<I> = {
  /** The original input that was passed to the tool */
  input: I
  /** The current attempt number (starting from 1) */
  attempt: number
  /** The error that caused the retry, if any */
  error?: unknown
}

/**
 * Function signature for custom tool retry logic.
 *
 * Retry functions receive information about the failed attempt and return a boolean
 * indicating whether the tool should be retried. This allows for sophisticated
 * retry strategies based on error types, attempt counts, or other factors.
 *
 * @template I - The input type for the tool
 *
 * @example
 * ```typescript
 * const retryLogic: ToolRetryFn<{ url: string }> = ({ attempt, error }) => {
 *   // Retry up to 3 times for network errors, but not for auth errors
 *   if (attempt >= 3) return false
 *   if (error?.message?.includes('401') || error?.message?.includes('403')) return false
 *   return error?.message?.includes('network') || error?.message?.includes('timeout')
 * }
 * ```
 */
export type ToolRetryFn<I> = (args: ToolRetryInput<I>) => boolean | Promise<boolean>

/** @internal Utility type to check if T is an object (but not a function) */
type IsObject<T> = T extends object ? (T extends Function ? false : true) : false

/** @internal Utility type that makes object types partial, but leaves primitives unchanged */
type SmartPartial<T> = IsObject<T> extends true ? Partial<T> : T

/**
 * Context information passed to tool handlers during execution.
 *
 * This context provides metadata about the tool call, which can be useful
 * for logging, debugging, or implementing features like call tracking.
 */
type ToolCallContext = {
  /** Unique identifier for this specific tool call */
  callId: string
}

export namespace Tool {
  export type JSON = {
    name: string
    aliases: string[]
    description?: string
    metadata: Record<string, unknown>
    input?: JSONSchema7
    output?: JSONSchema7
    staticInputValues?: SmartPartial<TypeOf<ZuiType>>
    maxRetries: number
  }
}

/**
 * Tool represents a callable function that agents can use to interact with external systems.
 *
 * Tools are the core building blocks of LLMz agents, providing type-safe interfaces between
 * the generated TypeScript code and external APIs, databases, file systems, or any other
 * service your agent needs to interact with.
 *
 * ## Key Features
 * - **Type Safety**: Full TypeScript inference with Zui/Zod schema validation
 * - **Input/Output Validation**: Automatic validation of inputs and outputs against schemas
 * - **Retry Logic**: Built-in retry mechanisms with custom retry functions
 * - **Static Values**: Pre-configure parameters that won't change between calls
 * - **Tool Cloning**: Create variations of existing tools with modified behavior
 * - **TypeScript Generation**: Generate type definitions for LLM context
 * - **Error Handling**: Comprehensive error handling with detailed validation messages
 *
 * ## Basic Usage
 *
 * ### Simple Tool
 * ```typescript
 * const weatherTool = new Tool({
 *   name: 'getCurrentWeather',
 *   description: 'Gets current weather conditions for a city',
 *   input: z.object({
 *     city: z.string().describe('City name'),
 *     units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
 *   }),
 *   output: z.object({
 *     temperature: z.number(),
 *     condition: z.string(),
 *     humidity: z.number(),
 *   }),
 *   async handler({ city, units }) {
 *     const response = await fetch(`/api/weather?city=${city}&units=${units}`)
 *     return response.json()
 *   },
 * })
 * ```
 *
 * ### Using Tools in Execute
 * ```typescript
 * const result = await execute({
 *   instructions: 'Get the weather for San Francisco and recommend clothing',
 *   tools: [weatherTool],
 *   client,
 * })
 * ```
 *
 * ## Advanced Patterns
 *
 * ### Static Input Values
 * Pre-configure parameters that shouldn't change:
 * ```typescript
 * const restrictedWeatherTool = weatherTool.setStaticInputValues({
 *   units: 'celsius' // Always use celsius, agent can't override
 * })
 * ```
 *
 * ### Retry Logic
 * Add resilience with custom retry logic:
 * ```typescript
 * const resilientTool = new Tool({
 *   name: 'apiCall',
 *   // ... other properties
 *   async handler({ endpoint }) {
 *     const response = await fetch(endpoint)
 *     if (!response.ok) throw new Error(`API error: ${response.status}`)
 *     return response.json()
 *   },
 *   retry: ({ attempt, error }) => {
 *     // Retry up to 3 times for network errors, but not auth errors
 *     if (attempt >= 3) return false
 *     if (error.message.includes('401') || error.message.includes('403')) return false
 *     return true
 *   },
 * })
 * ```
 *
 * ### Tool Cloning
 * Create variations of existing tools:
 * ```typescript
 * const enhancedWeatherTool = weatherTool.clone({
 *   name: 'getEnhancedWeather',
 *   description: 'Gets weather with additional forecasting',
 *   output: (original) => original!.extend({
 *     forecast: z.array(z.object({
 *       day: z.string(),
 *       temperature: z.number(),
 *       condition: z.string(),
 *     })),
 *   }),
 *   async handler(input) {
 *     const basicWeather = await weatherTool.execute(input, ctx)
 *     const forecast = await getForecast(input.city)
 *     return { ...basicWeather, forecast }
 *   },
 * })
 * ```
 *
 * ## Schema Design Best Practices
 *
 * ### Rich Descriptions
 * Use detailed descriptions to help the LLM understand when and how to use tools:
 * ```typescript
 * input: z.object({
 *   query: z.string()
 *     .min(1)
 *     .max(500)
 *     .describe('Search query - be specific and include relevant keywords'),
 *   maxResults: z.number()
 *     .min(1)
 *     .max(50)
 *     .default(10)
 *     .describe('Maximum number of results to return (1-50, default: 10)'),
 *   includeSnippets: z.boolean()
 *     .default(true)
 *     .describe('Whether to include content snippets in results'),
 * })
 * ```
 *
 * ### Enums for Controlled Values
 * Use enums to restrict inputs to valid options:
 * ```typescript
 * input: z.object({
 *   operation: z.enum(['create', 'read', 'update', 'delete'])
 *     .describe('CRUD operation to perform'),
 *   format: z.enum(['json', 'csv', 'xml'])
 *     .default('json')
 *     .describe('Output format for the response'),
 * })
 * ```
 *
 * ## Error Handling
 *
 * Tools automatically handle:
 * - **Input validation**: Invalid inputs throw descriptive errors
 * - **Output validation**: Outputs are validated but invalid outputs are still returned
 * - **Handler errors**: Exceptions in handlers are caught and can trigger retries
 * - **Type coercion**: Basic type coercion where possible
 *
 */
export class Tool<I extends ZuiType = ZuiType, O extends ZuiType = ZuiType> implements Serializable<Tool.JSON> {
  private _staticInputValues?: unknown

  public name: string
  public aliases: string[] = []
  public description?: string
  public metadata: Record<string, unknown>
  public input?: JSONSchema7
  public output?: JSONSchema7
  public retry?: ToolRetryFn<TypeOf<I>>

  public MAX_RETRIES = 1000

  /**
   * Sets static input values that will be automatically applied to all tool calls.
   *
   * Static values allow you to pre-configure certain parameters that shouldn't change
   * between calls, effectively removing them from the LLM's control while ensuring
   * they're always present when the tool executes.
   *
   * @param values - Partial input values to apply statically. Set to null/undefined to clear.
   * @returns The tool instance for method chaining
   *
   * @example
   * ```typescript
   * // Create a tool with configurable parameters
   * const searchTool = new Tool({
   *   name: 'search',
   *   input: z.object({
   *     query: z.string(),
   *     maxResults: z.number().default(10),
   *     includeSnippets: z.boolean().default(true),
   *   }),
   *   handler: async ({ query, maxResults, includeSnippets }) => {
   *     // Implementation
   *   },
   * })
   *
   * // Create a restricted version with static values
   * const restrictedSearch = searchTool.setStaticInputValues({
   *   maxResults: 5, // Always limit to 5 results
   *   includeSnippets: false, // Never include snippets
   * })
   *
   * // LLM can only control 'query' parameter now
   * // The tool will always use maxResults: 5, includeSnippets: false
   * ```
   *
   * @example
   * ```typescript
   * // Clear static values
   * const unrestricted = restrictedTool.setStaticInputValues(null)
   * ```
   */
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

  /**
   * Gets the computed input schema with static values applied.
   *
   * This property returns the final input schema that will be used for validation,
   * including any static input values that have been set via setStaticInputValues().
   *
   * @returns The Zui schema for input validation
   * @internal
   */
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

  /**
   * Gets the output schema for validation.
   *
   * @returns The Zui schema for output validation
   * @internal
   */
  public get zOutput() {
    return this.output ? transforms.fromJSONSchemaLegacy(this.output) : z.void()
  }

  /**
   * Renames the tool and updates its aliases.
   *
   * @param name - New name for the tool (must be a valid identifier)
   * @returns The tool instance for method chaining
   * @throws Error if the name is not a valid identifier
   *
   * @example
   * ```typescript
   * const weatherTool = new Tool({ name: 'getWeather', ... })
   * weatherTool.rename('getCurrentWeather')
   * console.log(weatherTool.name) // 'getCurrentWeather'
   * ```
   */
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

  /**
   * Creates a new tool based on this one with modified properties.
   *
   * Clone allows you to create variations of existing tools with different names,
   * schemas, handlers, or other configuration. This is useful for creating specialized
   * versions of tools or adding additional functionality.
   *
   * @param props - Properties to override in the cloned tool
   * @returns A new Tool instance with the specified modifications
   * @throws Error if cloning fails due to invalid configuration
   *
   * @example
   * ```typescript
   * // Create a basic search tool
   * const basicSearch = new Tool({
   *   name: 'search',
   *   input: z.object({ query: z.string() }),
   *   output: z.object({ results: z.array(z.string()) }),
   *   handler: async ({ query }) => ({ results: await search(query) }),
   * })
   *
   * // Clone with enhanced output schema
   * const enhancedSearch = basicSearch.clone({
   *   name: 'enhancedSearch',
   *   description: 'Search with additional metadata',
   *   output: (original) => original!.extend({
   *     totalResults: z.number(),
   *     searchTime: z.number(),
   *   }),
   *   handler: async ({ query }) => {
   *     const startTime = Date.now()
   *     const results = await search(query)
   *     return {
   *       results: results.items,
   *       totalResults: results.total,
   *       searchTime: Date.now() - startTime,
   *     }
   *   },
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Clone with restricted access
   * const restrictedTool = adminTool.clone({
   *   name: 'userTool',
   *   handler: async (input, ctx) => {
   *     // Add authorization check
   *     if (!isAuthorized(ctx.callId)) {
   *       throw new Error('Unauthorized access')
   *     }
   *     return adminTool.execute(input, ctx)
   *   },
   * })
   * ```
   */
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

  /**
   * Creates a new Tool instance.
   *
   * @param props - Tool configuration properties
   * @param props.name - Unique tool name (must be valid TypeScript identifier)
   * @param props.description - Human-readable description for the LLM
   * @param props.input - Zui/Zod schema for input validation (optional)
   * @param props.output - Zui/Zod schema for output validation (optional)
   * @param props.handler - Async function that implements the tool logic
   * @param props.aliases - Alternative names for the tool (optional)
   * @param props.metadata - Additional metadata for the tool (optional)
   * @param props.staticInputValues - Default input values (optional)
   * @param props.retry - Custom retry logic function (optional)
   *
   * @throws Error if name is not a valid identifier
   * @throws Error if description is not a string
   * @throws Error if metadata is not an object
   * @throws Error if handler is not a function
   * @throws Error if aliases contains invalid identifiers
   * @throws Error if input/output schemas are invalid
   *
   * @example
   * ```typescript
   * const weatherTool = new Tool({
   *   name: 'getCurrentWeather',
   *   description: 'Fetches current weather data for a given city',
   *   aliases: ['weather', 'getWeather'], // Alternative names
   *
   *   input: z.object({
   *     city: z.string().min(1).describe('City name to get weather for'),
   *     units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
   *     includeHourly: z.boolean().default(false),
   *   }),
   *
   *   output: z.object({
   *     temperature: z.number(),
   *     description: z.string(),
   *     humidity: z.number().min(0).max(100),
   *     hourlyForecast: z.array(z.object({
   *       hour: z.number(),
   *       temp: z.number(),
   *       condition: z.string(),
   *     })).optional(),
   *   }),
   *
   *   async handler({ city, units, includeHourly }) {
   *     const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}&units=${units}`)
   *     const data = await response.json()
   *
   *     const result = {
   *       temperature: data.main.temp,
   *       description: data.weather[0].description,
   *       humidity: data.main.humidity,
   *     }
   *
   *     if (includeHourly) {
   *       result.hourlyForecast = data.hourly?.slice(0, 24) || []
   *     }
   *
   *     return result
   *   },
   *
   *   // Optional: Add retry logic for network errors
   *   retry: ({ attempt, error }) => {
   *     return attempt < 3 && error.message.includes('network')
   *   },
   *
   *   // Optional: Add metadata
   *   metadata: {
   *     category: 'weather',
   *     rateLimit: 100,
   *     cacheable: true,
   *   },
   * })
   * ```
   */
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

  /**
   * Executes the tool with the given input and context.
   *
   * This method handles input validation, retry logic, output validation, and error handling.
   * It's called internally by the LLMz execution engine when generated code calls the tool.
   *
   * @param input - Input data to pass to the tool handler
   * @param ctx - Tool call context containing call ID and other metadata
   * @returns Promise resolving to the tool's output
   * @throws Error if input validation fails
   * @throws Error if tool execution fails after all retries
   *
   * @example
   * ```typescript
   * // Direct tool execution (usually done by LLMz internally)
   * const result = await weatherTool.execute(
   *   { city: 'San Francisco', units: 'fahrenheit' },
   *   { callId: 'call_123' }
   * )
   * console.log(result.temperature) // 72
   * ```
   *
   * @internal This method is primarily used internally by the LLMz execution engine
   */
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

  /**
   * Generates TypeScript type definitions for this tool.
   *
   * This method creates TypeScript function declarations that are included in the
   * LLM's context to help it understand how to call the tool correctly. The generated
   * types include parameter types, return types, and JSDoc comments with descriptions.
   *
   * @returns Promise resolving to TypeScript declaration string
   */
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

  /**
   * Ensures all tools in an array have unique names by appending numbers to duplicates.
   *
   * When multiple tools have the same name, this method renames them by appending
   * incrementing numbers (tool1, tool2, etc.) to avoid conflicts. Tools with already
   * unique names are left unchanged.
   *
   * You usually don't need to call this method directly, as LLMz will automatically detect and rename tools with conflicting names.
   *
   * @param tools - Array of tools to process for unique names
   * @returns Array of tools with guaranteed unique names
   *
   * @example
   * ```typescript
   * const tools = [
   *   new Tool({ name: 'search', handler: async () => {} }),
   *   new Tool({ name: 'search', handler: async () => {} }),
   *   new Tool({ name: 'unique', handler: async () => {} }),
   *   new Tool({ name: 'search', handler: async () => {} }),
   * ]
   *
   * const uniqueTools = Tool.withUniqueNames(tools)
   * console.log(uniqueTools.map(t => t.name))
   * // Output: ['search1', 'search1', 'unique', 'search']
   * // Note: The last occurrence keeps the original name
   * ```
   *
   * @static
   */
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

  /**
   * Converts the tool to its JSON representation.
   *
   * @returns JSON representation of the Tool instance
   */
  public toJSON() {
    return {
      name: this.name,
      aliases: [...this.aliases],
      description: this.description,
      metadata: this.metadata,
      input: this.input,
      output: this.output,
      staticInputValues: this._staticInputValues,
      maxRetries: this.MAX_RETRIES,
    } satisfies Tool.JSON
  }
}
