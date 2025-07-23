import { transforms } from '@bpinternal/zui'
import { JSONSchema7 } from 'json-schema'
import { uniq } from 'lodash-es'
import { ZuiType } from './types.js'
import { isJsonSchema, isValidIdentifier, isZuiSchema } from './utils.js'

/**
 * Represents the result of an agent execution that exited with a specific Exit.
 *
 * @template T - The type of the exit result data
 */
export type ExitResult<T = unknown> = {
  /** The Exit instance that was used to terminate execution */
  exit: Exit<T>
  /** The result data returned by the exit (validated against the exit's schema) */
  result: T
}

/**
 * Defines how LLMz agent execution can terminate.
 *
 * Exits are the primary mechanism for controlling how and when agent execution completes.
 * They define the possible outcomes of an execution and provide type-safe result handling.
 * When an agent calls `return { action: 'exit_name', ...data }`, the execution terminates
 * with the corresponding Exit.
 *
 * ## Core Concepts
 *
 * **Termination Control**: Exits define the valid ways an agent execution can end.
 * Unlike traditional functions that just return values, LLMz agents must explicitly
 * exit through predefined exits, ensuring controlled and predictable termination.
 *
 * **Type Safety**: Each exit can define a Zod/Zui schema that validates the return data,
 * providing compile-time and runtime type safety for execution results.
 *
 * **Flow Control**: Different exits allow for different execution paths and result
 * handling, enabling complex decision-making and branching logic.
 *
 * **Built-in vs Custom**: LLMz provides built-in exits (ThinkExit, ListenExit, DefaultExit)
 * for common patterns, while custom exits enable domain-specific termination logic.
 *
 * ## Usage Patterns
 *
 * ### Simple Exit (No Data)
 *
 * For basic flow control without additional data:
 *
 * ```typescript
 * const exit = new Exit({
 *   name: 'exit',
 *   description: 'When the user wants to exit the program',
 * })
 *
 * // Agent usage: return { action: 'exit' }
 *
 * // Result handling
 * if (result.is(exit)) {
 *   console.log('User chose to exit')
 *   process.exit(0)
 * }
 * ```
 *
 * ### Exit with Schema (Typed Data)
 *
 * For structured data extraction with validation:
 *
 * ```typescript
 * const escalation = new Exit({
 *   name: 'escalation',
 *   description: 'Escalate the issue to a human agent',
 *   schema: z.object({
 *     reason: z.enum(['Frustrated user', 'Technical issue', 'Sensitive topic', 'Other']),
 *     priority: z.enum(['low', 'medium', 'high']).default('medium'),
 *     details: z.string(),
 *   }),
 * })
 *
 * // Agent usage: return { action: 'escalation', reason: 'Technical issue', details: '...' }
 *
 * // Type-safe result handling
 * if (result.is(escalation)) {
 *   console.log(`Escalation: ${result.output.reason}`)
 *   console.log(`Priority: ${result.output.priority}`)
 *   console.log(`Details: ${result.output.details}`)
 * }
 * ```
 *
 * ### Multiple Exits for Decision Making
 *
 * Enabling different execution paths:
 *
 * ```typescript
 * const approved = new Exit({
 *   name: 'approved',
 *   description: 'Request was approved',
 *   schema: z.object({
 *     amount: z.number(),
 *     reference: z.string(),
 *   }),
 * })
 *
 * const rejected = new Exit({
 *   name: 'rejected',
 *   description: 'Request was rejected',
 *   schema: z.object({
 *     reason: z.string(),
 *   }),
 * })
 *
 * const result = await execute({
 *   instructions: 'Process the loan application',
 *   exits: [approved, rejected],
 *   tools: [reviewTool, creditCheckTool],
 *   client,
 * })
 *
 * if (result.is(approved)) {
 *   console.log(`Approved: $${result.output.amount} (${result.output.reference})`)
 * } else if (result.is(rejected)) {
 *   console.log(`Rejected: ${result.output.reason}`)
 * }
 * ```
 *
 * ## Advanced Features
 *
 * ### Exit Aliases
 *
 * Multiple names for the same exit:
 *
 * ```typescript
 * const exit = new Exit({
 *   name: 'complete',
 *   aliases: ['done', 'finished', 'end'],
 *   description: 'Task completed successfully',
 * })
 *
 * // Agent can use any alias: return { action: 'done' } or { action: 'finished' }
 * ```
 *
 * ### Exit Metadata for Orchestration
 *
 * Additional data for complex systems:
 *
 * ```typescript
 * const handoff = new Exit({
 *   name: 'handoff_sales',
 *   description: 'Handoff to sales agent',
 *   metadata: {
 *     type: 'handoff',
 *     agent: 'sales',
 *     department: 'customer_service',
 *   },
 *   schema: z.object({
 *     reason: z.string(),
 *     context: z.record(z.any()),
 *   }),
 * })
 *
 * // Use metadata in exit callbacks
 * onExit: async (result) => {
 *   if (result.exit.metadata?.type === 'handoff') {
 *     await routeToAgent(result.exit.metadata.agent, result.result)
 *   }
 * }
 * ```
 *
 * ### Exit Callbacks and Hooks
 *
 * Custom logic when exits are triggered:
 *
 * ```typescript
 * const result = await execute({
 *   instructions: 'Process customer request',
 *   exits: [approved, rejected],
 *   onExit: async (exitResult) => {
 *     // Called before execution completes
 *     await logOutcome(exitResult.exit.name, exitResult.result)
 *
 *     // Can throw to prevent exit and force retry
 *     if (needsManagerApproval(exitResult)) {
 *       throw new Error('Manager approval required')
 *     }
 *   },
 *   client,
 * })
 * ```
 *
 * ## Exit Cloning and Modification
 *
 * Create variations of existing exits:
 *
 * ```typescript
 * const baseExit = new Exit({
 *   name: 'base',
 *   description: 'Base exit',
 *   schema: z.object({ status: z.string() }),
 * })
 *
 * const customExit = baseExit.clone().rename('custom')
 * // Creates independent copy with new name
 * ```
 *
 * ## Best Practices
 *
 * 1. **Descriptive Names**: Use clear, action-oriented names that describe the outcome
 * 2. **Comprehensive Schemas**: Define complete data structures with descriptions
 * 3. **Multiple Exits**: Design multiple exits for different execution paths
 * 4. **Type Safety**: Always use `result.is(exit)` for type-safe result handling
 * 5. **Documentation**: Provide clear descriptions for both the exit and schema fields
 * 6. **Validation**: Use Zod's validation features (enums, constraints, defaults)
 *
 * @template T - The type of data this exit returns (inferred from schema)
 *
 * @see {@link ExecutionResult} For result handling
 * @see {@link ThinkExit} Built-in thinking exit
 * @see {@link ListenExit} Built-in chat listening exit
 * @see {@link DefaultExit} Built-in completion exit
 */
export class Exit<T = unknown> {
  /** The primary name of the exit (used in return statements) */
  public name: string
  /** Alternative names that can be used to reference this exit */
  public aliases: string[] = []
  /** Human-readable description of when this exit should be used */
  public description: string
  /** Additional metadata for orchestration and custom logic */
  public metadata: Record<string, unknown>
  /** JSON Schema for validating exit result data */
  public schema?: JSONSchema7

  /**
   * Returns the Zod schema equivalent of the JSON schema (if available).
   * Used internally for validation and type inference.
   */
  public get zSchema() {
    return this.schema ? transforms.fromJSONSchemaLegacy(this.schema) : undefined
  }

  /**
   * Renames the exit and updates aliases accordingly.
   *
   * @param name - The new name for the exit (must be a valid identifier)
   * @returns This exit instance for chaining
   *
   * @example
   * ```typescript
   * const exit = new Exit({ name: 'old_name', description: 'Test exit' })
   * exit.rename('new_name')
   * console.log(exit.name) // 'new_name'
   * ```
   */
  public rename(name: string) {
    const before = this.name

    if (!isValidIdentifier(name)) {
      throw new Error(
        `Invalid name for exit ${name}. An exit name must start with a letter and contain only letters, numbers, and underscores. It must be 1-50 characters long.`
      )
    }

    this.name = name
    this.aliases = uniq([name, ...this.aliases.map((alias) => (alias === before ? name : alias))])

    return this
  }

  /**
   * Creates a deep copy of this exit.
   *
   * The clone is completely independent and can be modified without affecting
   * the original exit. This is useful for creating variations of existing exits.
   *
   * @returns A new Exit instance with the same configuration
   *
   * @example
   * ```typescript
   * const originalExit = new Exit({
   *   name: 'base',
   *   description: 'Base exit',
   *   schema: z.object({ status: z.string() }),
   * })
   *
   * const customExit = originalExit.clone().rename('custom')
   * // customExit is independent of originalExit
   * ```
   */
  public clone() {
    return new Exit({
      name: this.name,
      aliases: [...this.aliases],
      description: this.description,
      metadata: JSON.parse(JSON.stringify(this.metadata)),
      schema: this.zSchema,
    })
  }

  /**
   * Type guard to check if this exit matches another exit by name.
   *
   * Used internally for type narrowing and exit comparison.
   *
   * @param exit - The exit to compare against
   * @returns True if the exits have the same name
   */
  public is<T>(exit: Exit<T>): this is Exit<T> {
    return this.name === exit.name
  }

  /**
   * Type guard to check if an ExitResult matches this exit.
   *
   * @param result - The exit result to check
   * @returns True if the result was created by this exit
   */
  public match(result: ExitResult): result is ExitResult<T> {
    return result.exit instanceof Exit && this.name === result.exit.name
  }

  /**
   * Creates a new Exit instance.
   *
   * @param props - Exit configuration
   * @param props.name - Primary name for the exit (must be valid identifier)
   * @param props.description - Human-readable description of the exit's purpose
   * @param props.aliases - Alternative names that can be used to reference this exit
   * @param props.metadata - Additional data for orchestration and custom logic
   * @param props.schema - Zod schema for validating exit result data
   *
   * @example
   * ```typescript
   * // Simple exit without data validation
   * const exit = new Exit({
   *   name: 'complete',
   *   description: 'Task completed successfully',
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Exit with typed result data
   * const approval = new Exit({
   *   name: 'approved',
   *   description: 'Request approved by system',
   *   schema: z.object({
   *     amount: z.number().positive(),
   *     reference: z.string().min(1),
   *     timestamp: z.date().default(() => new Date()),
   *   }),
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Exit with aliases and metadata
   * const handoff = new Exit({
   *   name: 'handoff_support',
   *   aliases: ['escalate', 'transfer'],
   *   description: 'Transfer to human support agent',
   *   metadata: {
   *     department: 'customer_service',
   *     priority: 'high',
   *   },
   *   schema: z.object({
   *     reason: z.string(),
   *     customerData: z.record(z.any()),
   *   }),
   * })
   * ```
   */
  public constructor(props: {
    name: string
    aliases?: string[]
    description: string
    metadata?: Record<string, unknown>
    schema?: ZuiType<T>
  }) {
    if (!isValidIdentifier(props.name)) {
      throw new Error(
        `Invalid name for exit ${props.name}. A exit name must start with a letter and contain only letters, numbers, and underscores. It must be 1-50 characters long.`
      )
    }

    if (typeof props.description !== 'string' || props.description.trim().length === 0) {
      throw new Error(
        `Invalid description for exit ${props.name}. Expected a non-empty string, but got type "${typeof props.description}"`
      )
    }

    if (props.metadata !== undefined && typeof props.metadata !== 'object') {
      throw new Error(
        `Invalid metadata for exit ${props.name}. Expected an object, but got type "${typeof props.metadata}"`
      )
    }

    if (props.aliases !== undefined && !Array.isArray(props.aliases)) {
      throw new Error(
        `Invalid aliases for exit ${props.name}. Expected an array, but got type "${typeof props.aliases}"`
      )
    }

    if (props.aliases && props.aliases.some((alias) => !isValidIdentifier(alias))) {
      throw new Error(`Invalid aliases for exit ${props.name}. Expected an array of valid identifiers.`)
    }

    if (typeof props.schema !== 'undefined') {
      if (isZuiSchema(props.schema)) {
        this.schema = transforms.toJSONSchemaLegacy(props.schema)
      } else if (isJsonSchema(props.schema)) {
        this.schema = props.schema
      } else {
        throw new Error(
          `Invalid input schema for exit ${props.name}. Expected a ZodType or JSONSchema, but got type "${typeof props.schema}"`
        )
      }
    }

    this.name = props.name
    this.aliases = uniq([props.name, ...(props.aliases ?? [])])
    this.description = props.description
    this.metadata = props.metadata ?? {}
  }

  /**
   * Ensures all exits in an array have unique names by renaming duplicates.
   *
   * When multiple exits have the same name, this method appends numbers to
   * create unique names (e.g., 'exit1', 'exit2'). This prevents naming conflicts
   * in execution contexts with multiple exits.
   *
   * @param exits - Array of exits that may have duplicate names
   * @returns Array of exits with guaranteed unique names
   *
   * @example
   * ```typescript
   * const exit1 = new Exit({ name: 'done', description: 'First done' })
   * const exit2 = new Exit({ name: 'done', description: 'Second done' })
   *
   * const uniqueExits = Exit.withUniqueNames([exit1, exit2])
   * // Result: [{ name: 'done' }, { name: 'done1' }]
   * ```
   */
  public static withUniqueNames = (exits: Exit[]) => {
    const names = new Set<string>()
    return exits.map((exit) => {
      if (exits.filter((t) => t.name === exit.name).length === 1) {
        // If the name is unique, return the exit as is, no numbers appended
        return exit
      }

      let counter = 1
      let exitName = exit.name + counter

      while (names.has(exitName)) {
        exitName = `${exit.name}${++counter}`
      }

      return exit.rename(exitName)
    })
  }
}
