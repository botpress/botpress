import { z } from '@bpinternal/zui'

import { formatTypings } from './formatting.js'
import { hoistTypings } from './hoist.js'
import { Tool } from './tool.js'
import { getTypings } from './typings.js'
import { escapeString, getMultilineComment, isValidIdentifier } from './utils.js'

/** How many lines of code an object needs to have before we insert a comment for end tag */
const LARGE_OBJECT_LINES_OF_CODE = 10

/**
 * Defines a property within an ObjectInstance.
 *
 * Properties are stateful variables that can be accessed and optionally modified
 * by the generated TypeScript code. They provide a way to maintain state across
 * execution iterations and can include validation rules.
 *
 * @example
 * ```typescript
 * const userAgeProperty: ObjectProperty = {
 *   name: 'age',
 *   description: 'User age with validation constraints',
 *   value: 25,
 *   type: z.number().min(18).max(100),
 *   writable: true,
 * }
 * ```
 */
export type ObjectProperty = {
  /** The name of the property (must be a valid TypeScript identifier) */
  name: string
  /** The current value of the property */
  value: any
  /** Optional Zod schema for validation when the property is modified */
  type?: z.Schema
  /** Optional human-readable description of the property */
  description?: string
  /** Whether the LLM can modify this property (default: false) */
  writable?: boolean
}

/**
 * ObjectInstance creates stateful, namespace-scoped objects for LLMz agents.
 *
 * Objects combine properties (stateful variables) and tools (functions) into a
 * single namespace that the LLM can interact with. This provides organized,
 * type-safe interfaces for complex data and functionality.
 *
 * ## Key Features
 * - **Stateful Properties**: Variables that persist across execution iterations
 * - **Validation**: Zod schema validation for property changes
 * - **Tool Grouping**: Organize related tools under a common namespace
 * - **Type Safety**: Full TypeScript inference and validation
 * - **Dynamic Updates**: Properties can reflect real-time state changes
 *
 * ## Use Cases
 * - **User Profile Management**: Collect and validate user data over time
 * - **API Namespacing**: Group related API calls under a common interface
 * - **State Machines**: Track and modify execution state
 * - **Configuration Objects**: Manage settings and preferences
 * - **Multi-Agent Systems**: Per-agent state and capabilities
 *
 * ## Basic Usage
 *
 * ### Simple Property Object
 * ```typescript
 * const userProfile = new ObjectInstance({
 *   name: 'user',
 *   description: 'User profile data',
 *   properties: [
 *     {
 *       name: 'name',
 *       value: 'John Doe',
 *       type: z.string().min(1),
 *       writable: true,
 *     },
 *     {
 *       name: 'email',
 *       value: null,
 *       type: z.string().email().nullable(),
 *       writable: true,
 *     },
 *     {
 *       name: 'id',
 *       value: 'user_123',
 *       writable: false, // Read-only
 *     },
 *   ],
 * })
 *
 * // LLM can access and modify: user.name, user.email
 * // LLM can read only: user.id
 * ```
 *
 * ### Tool Grouping
 * ```typescript
 * const fileSystem = new ObjectInstance({
 *   name: 'fs',
 *   description: 'File system operations',
 *   tools: [
 *     new Tool({
 *       name: 'readFile',
 *       input: z.object({ path: z.string() }),
 *       output: z.string(),
 *       handler: async ({ path }) => readFileSync(path, 'utf8'),
 *     }),
 *     new Tool({
 *       name: 'writeFile',
 *       input: z.object({ path: z.string(), content: z.string() }),
 *       handler: async ({ path, content }) => writeFileSync(path, content),
 *     }),
 *   ],
 * })
 *
 * // LLM can call: fs.readFile(), fs.writeFile()
 * ```
 *
 * ### Combined Properties and Tools
 * ```typescript
 * const database = new ObjectInstance({
 *   name: 'db',
 *   description: 'Database connection with state',
 *   properties: [
 *     {
 *       name: 'connectionString',
 *       value: 'postgresql://localhost:5432/mydb',
 *       writable: false,
 *     },
 *     {
 *       name: 'lastQuery',
 *       value: null,
 *       type: z.string().nullable(),
 *       writable: true,
 *     },
 *   ],
 *   tools: [
 *     new Tool({
 *       name: 'query',
 *       input: z.object({ sql: z.string() }),
 *       output: z.array(z.record(z.any())),
 *       handler: async ({ sql }) => {
 *         // Execute query and update lastQuery property
 *         const results = await executeQuery(sql)
 *         return results
 *       },
 *     }),
 *   ],
 * })
 * ```
 *
 * ## Dynamic Objects
 *
 * Objects can be created dynamically to reflect current state:
 *
 * ```typescript
 * const memory: Record<string, any> = {}
 *
 * const getObjects = () => [
 *   new ObjectInstance({
 *     name: 'user',
 *     properties: [
 *       {
 *         name: 'name',
 *         value: memory.name ?? null,
 *         type: z.string().nullable(),
 *         writable: true,
 *       },
 *       {
 *         name: 'age',
 *         value: memory.age ?? null,
 *         type: z.number().min(18).max(100).nullable(),
 *         writable: true,
 *       },
 *     ],
 *   }),
 * ]
 *
 * await execute({
 *   objects: getObjects, // Function returning current state
 *   onTrace: ({ trace }) => {
 *     if (trace.type === 'property') {
 *       // Persist property changes
 *       memory[trace.property] = trace.value
 *     }
 *   },
 *   // ...
 * })
 * ```
 *
 * ## Property Validation
 *
 * Properties support comprehensive validation through Zod schemas:
 *
 * ```typescript
 * const userSettings = new ObjectInstance({
 *   name: 'settings',
 *   properties: [
 *     {
 *       name: 'theme',
 *       value: 'light',
 *       type: z.enum(['light', 'dark']),
 *       writable: true,
 *     },
 *     {
 *       name: 'maxRetries',
 *       value: 3,
 *       type: z.number().min(1).max(10),
 *       writable: true,
 *     },
 *     {
 *       name: 'email',
 *       value: null,
 *       type: z.string().email().nullable(),
 *       writable: true,
 *     },
 *   ],
 * })
 * ```
 *
 * ## TypeScript Integration
 *
 * Objects generate TypeScript namespace declarations:
 *
 * ```typescript
 * // Generated types for the LLM context:
 * export namespace user {
 *   const name: Writable<string | null> = null
 *   const age: Writable<number | null> = null
 *   const id: Readonly<string> = "user_123"
 * }
 *
 * export namespace fs {
 *   function readFile(args: { path: string }): Promise<string>
 *   function writeFile(args: { path: string, content: string }): Promise<void>
 * }
 * ```
 *
 * @see {@link https://github.com/botpress/botpress/blob/master/packages/llmz/examples/09_chat_variables/index.ts} Example usage
 */
export class ObjectInstance {
  public name: string
  public description?: string
  public properties?: ObjectProperty[]
  public tools?: Tool[]
  public metadata?: Record<string, unknown>

  /**
   * Creates a new ObjectInstance.
   *
   * @param props - Object configuration
   * @param props.name - Unique object name (must be valid TypeScript identifier)
   * @param props.description - Human-readable description of the object
   * @param props.tools - Array of tools to group under this object namespace
   * @param props.properties - Array of stateful properties for this object
   * @param props.metadata - Additional metadata for the object
   *
   * @throws Error if name is not a valid identifier
   * @throws Error if description is not a string
   * @throws Error if metadata is not an object
   * @throws Error if properties/tools are not arrays
   * @throws Error if properties exceed 100 limit
   * @throws Error if property names are duplicated or invalid
   * @throws Error if property descriptions exceed 5000 characters
   *
   * @example
   * ```typescript
   * const userProfile = new ObjectInstance({
   *   name: 'user',
   *   description: 'User profile management',
   *   properties: [
   *     {
   *       name: 'name',
   *       value: 'John Doe',
   *       type: z.string().min(1),
   *       description: 'User full name',
   *       writable: true,
   *     },
   *     {
   *       name: 'email',
   *       value: null,
   *       type: z.string().email().nullable(),
   *       description: 'User email address',
   *       writable: true,
   *     },
   *   ],
   *   tools: [
   *     new Tool({
   *       name: 'updateProfile',
   *       input: z.object({ name: z.string(), email: z.string() }),
   *       handler: async ({ name, email }) => {
   *         // Update external system
   *         await updateUserInDatabase({ name, email })
   *       },
   *     }),
   *   ],
   *   metadata: {
   *     version: '1.0',
   *     category: 'user-management',
   *   },
   * })
   * ```
   */
  public constructor(props: {
    name: string
    description?: string
    tools?: Tool[]
    properties?: ObjectProperty[]
    metadata?: Record<string, unknown>
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

    if (props.properties !== undefined && !Array.isArray(props.properties)) {
      throw new Error(
        `Invalid properties for tool ${props.name}. Expected an array, but got type "${typeof props.properties}"`
      )
    }

    if (props.tools !== undefined && !Array.isArray(props.tools)) {
      throw new Error(`Invalid tools for tool ${props.name}. Expected an array, but got type "${typeof props.tools}"`)
    }

    if (props.properties?.length) {
      if (props.properties.length > 100) {
        throw new Error(
          `Too many properties for tool ${props.name}. Expected at most 100 properties, but got ${props.properties.length}`
        )
      }

      for (const prop of props.properties) {
        if (props.properties.filter((p) => p.name === prop.name).length > 1) {
          throw new Error(`Duplicate property name "${prop.name}" in tool ${props.name}`)
        }

        if (!isValidIdentifier(prop.name)) {
          throw new Error(
            `Invalid name for property ${prop.name}. A property name must start with a letter and contain only letters, numbers, and underscores. It must be 1-50 characters long.`
          )
        }

        if (prop.description !== undefined && typeof prop.description !== 'string') {
          throw new Error(
            `Invalid description for property ${prop.name}. Expected a string, but got type "${typeof prop.description}"`
          )
        }

        if (props.description && props.description.length >= 5000) {
          throw new Error(
            `Description for property ${prop.name} is too long. Expected at most 5000 characters, but got ${props.description.length}`
          )
        }

        if (typeof prop.writable !== 'boolean') {
          prop.writable = false
        }
      }
    }

    this.name = props.name
    this.description = props.description
    this.metadata = props.metadata ?? {}
    this.properties = props.properties
    this.tools = Tool.withUniqueNames(props.tools ?? [])
  }

  /**
   * Generates TypeScript namespace declarations for this object.
   *
   * This method creates TypeScript definitions that are included in the LLM context
   * to help it understand the available properties and tools. Properties become
   * const declarations with appropriate Readonly/Writable types, and tools become
   * function signatures.
   *
   * @returns Promise resolving to TypeScript namespace declaration
   *
   * @example
   * ```typescript
   * const obj = new ObjectInstance({
   *   name: 'user',
   *   properties: [
   *     { name: 'name', value: 'John', writable: true },
   *     { name: 'id', value: 123, writable: false },
   *   ],
   *   tools: [
   *     new Tool({
   *       name: 'save',
   *       input: z.object({ data: z.string() }),
   *       handler: async ({ data }) => { /* ... *\/ },
   *     }),
   *   ],
   * })
   *
   * const typings = await obj.getTypings()
   * console.log(typings)
   * // Output:
   * // export namespace user {
   * //   const name: Writable<string> = "John"
   * //   const id: Readonly<number> = 123
   * //   function save(args: { data: string }): Promise<void>
   * // }
   * ```
   */
  public async getTypings() {
    return getObjectTypings(this).withProperties().withTools().build()
  }
}

/**
 * Creates a TypeScript namespace builder for an ObjectInstance.
 *
 * This function provides a fluent API for generating TypeScript declarations
 * that include properties, tools, or both. It's used internally by ObjectInstance.getTypings().
 *
 * @param obj - The ObjectInstance to generate typings for
 * @returns A builder object with methods to configure and build the namespace
 * @internal
 */
function getObjectTypings(obj: ObjectInstance) {
  let includeProperties = false
  let includeTools = false
  let hoisting = false

  const typings: string[] = []

  const addProperties = async () => {
    if (includeProperties && obj.properties?.length) {
      typings.push('')
      typings.push('// ---------------- //')
      typings.push('//    Properties    //')
      typings.push('// ---------------- //')
      typings.push('')

      for (const prop of obj.properties ?? []) {
        const description = prop.description ?? ''

        if (description?.trim().length) {
          typings.push(getMultilineComment(description))
        }

        let type = 'unknown'

        if (prop.type) {
          type = await getTypings(prop.type, {})
        } else if (prop.value !== undefined) {
          type = typeof prop.value
        }

        type = prop.writable ? `Writable<${type}>` : `Readonly<${type}>`
        const value = embedPropertyValue(prop)

        typings.push(`const ${prop.name}: ${type} = ${value}`)
      }
    }
  }

  const addTools = async () => {
    if (includeTools && obj.tools?.length) {
      typings.push('')
      typings.push('// ---------------- //')
      typings.push('//       Tools      //')
      typings.push('// ---------------- //')
      typings.push('')

      for (const tool of obj.tools) {
        const fnType = z
          .function(tool.zInput as any, tool.zOutput)
          .title(tool.name)
          .describe(tool.description ?? '')

        let temp = await getTypings(fnType, {
          declaration: true,
        })

        temp = temp.replace('declare function ', 'function ')
        typings.push(temp)
      }
    }
  }

  const finalize = async () => {
    let closingBracket = ''
    if (typings.length >= LARGE_OBJECT_LINES_OF_CODE) {
      closingBracket = ` // end namespace "${obj.name}"`
    }

    let body = typings.join('\n')
    if (hoisting) {
      body = await hoistTypings(body, { throwOnError: false })
    }

    typings.push('}' + closingBracket)

    let header = ''

    if (obj.description?.trim().length) {
      header = getMultilineComment(obj.description)
    }

    return formatTypings(
      `${header}
      export namespace ${obj.name} {
      ${body}
      } ${closingBracket}`.trim(),
      { throwOnError: false }
    )
  }

  const api = {
    withProperties: () => {
      includeProperties = true
      return api
    },
    withTools: () => {
      includeTools = true
      return api
    },
    withHoisting: () => {
      hoisting = true
      return api
    },
    async build() {
      await addProperties()
      await addTools()
      return finalize()
    },
  }

  return api
}

/**
 * Converts a property value to its TypeScript literal representation.
 *
 * This function handles the serialization of various JavaScript types into
 * TypeScript code that can be embedded in generated namespace declarations.
 * It supports primitives, objects, arrays, dates, regex, and other common types.
 *
 * @param property - The ObjectProperty containing the value to embed
 * @returns String representation of the value for use in TypeScript code
 * @internal
 */
function embedPropertyValue(property: ObjectProperty): string {
  if (typeof property.value === 'string') {
    return escapeString(property.value)
  }

  if (Number.isNaN(property.value)) {
    return 'NaN'
  }

  if (typeof property.value === 'number' && Number.isInteger(property.value)) {
    return property.value.toString()
  }

  if (typeof property.value === 'boolean') {
    return property.value.toString()
  }

  if (Array.isArray(property.value) || typeof property.value === 'object') {
    return JSON.stringify(property.value)
  }

  if (property.value instanceof Date) {
    return `new Date('${property.value.toISOString()}')`
  }

  if (property.value instanceof RegExp) {
    return `new RegExp(${escapeString(property.value.source)}, ${escapeString(property.value.flags)})`
  }

  if (property.value === null) {
    return 'null'
  }

  if (property.value === undefined) {
    return 'undefined'
  }

  if (typeof property.value === 'function') {
    return 'function() {}'
  }

  if (typeof property.value === 'symbol') {
    return 'Symbol()'
  }

  if (typeof property.value === 'bigint') {
    return `${property.value}n`
  }

  if (property.value instanceof Error) {
    return `Error(${escapeString(property.value.message)})`
  }

  if (property.value instanceof Map) {
    return `new Map(${JSON.stringify(Array.from(property.value.entries()))})`
  }

  if (property.value instanceof Set) {
    return `new Set(${JSON.stringify(Array.from(property.value.values()))})`
  }

  return 'unknown'
}
