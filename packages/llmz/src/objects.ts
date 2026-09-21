import { z } from '@bpinternal/zui'
import { InvalidObjectError } from './errors.js'

import { formatTypings } from './formatting.js'
import { Tool } from './tool.js'
import { Serializable, ZuiType } from './types.js'
import { getTypings } from './typings.js'
import { getMultilineComment, isValidIdentifier } from './utils.js'

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
  type?: ZuiType
  /** Optional human-readable description of the property */
  description?: string
  /** Whether the LLM can modify this property (default: false) */
  writable?: boolean
}

export namespace ObjectInstance {
  export type JSON = {
    name: string
    description?: string
    properties?: ObjectProperty[]
    tools?: Tool.JSON[]
    metadata?: Record<string, unknown>
  }
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
 */
export class ObjectInstance implements Serializable<ObjectInstance.JSON> {
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
    if (!props || typeof props !== 'object' || Array.isArray(props)) {
      throw new InvalidObjectError('Object definition must be an object.')
    }

    if (!isValidIdentifier(props.name)) {
      throw new InvalidObjectError(
        `Invalid name for tool ${props.name}. A tool name must start with a letter and contain only letters, numbers, and underscores. It must be 1-50 characters long.`
      )
    }

    if (props.description !== undefined && typeof props.description !== 'string') {
      throw new InvalidObjectError(
        `Invalid description for tool ${props.name}. Expected a string, but got type "${typeof props.description}"`
      )
    }

    if (props.metadata !== undefined && typeof props.metadata !== 'object') {
      throw new InvalidObjectError(
        `Invalid metadata for tool ${props.name}. Expected an object, but got type "${typeof props.metadata}"`
      )
    }

    if (props.properties !== undefined && !Array.isArray(props.properties)) {
      throw new InvalidObjectError(
        `Invalid properties for tool ${props.name}. Expected an array, but got type "${typeof props.properties}"`
      )
    }

    if (props.tools !== undefined && !Array.isArray(props.tools)) {
      throw new InvalidObjectError(
        `Invalid tools for tool ${props.name}. Expected an array, but got type "${typeof props.tools}"`
      )
    }

    if (props.properties?.length) {
      if (props.properties.length > 100) {
        throw new InvalidObjectError(
          `Too many properties for tool ${props.name}. Expected at most 100 properties, but got ${props.properties.length}`
        )
      }

      for (const prop of props.properties) {
        if (props.properties.filter((p) => p.name === prop.name).length > 1) {
          throw new InvalidObjectError(`Duplicate property name "${prop.name}" in tool ${props.name}`)
        }

        if (!isValidIdentifier(prop.name)) {
          throw new InvalidObjectError(
            `Invalid name for property ${prop.name}. A property name must start with a letter and contain only letters, numbers, and underscores. It must be 1-50 characters long.`
          )
        }

        if (prop.description !== undefined && typeof prop.description !== 'string') {
          throw new InvalidObjectError(
            `Invalid description for property ${prop.name}. Expected a string, but got type "${typeof prop.description}"`
          )
        }

        if (props.description && props.description.length >= 5000) {
          throw new InvalidObjectError(
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

  /** Callable API only. Property values, schemas, and access rules belong in Memory. */
  public async getToolTypings(): Promise<string> {
    const declarations: string[] = []

    for (const tool of this.tools ?? []) {
      const signature = z
        .function(tool.zInput as any, tool.zOutput)
        .title(tool.name)
        .describe(tool.description ?? '')
      const declaration = await getTypings(signature, { declaration: true })
      declarations.push(declaration.replace('declare function ', 'function '))
    }

    const description = this.description?.trim() ? getMultilineComment(this.description) : ''
    const body = declarations.join('\n\n')

    return formatTypings(`${description}\nexport namespace ${this.name} {\n${body}\n}`, { throwOnError: false })
  }

  /**
   * Converts this ObjectInstance to its JSON representation.
   *
   * This method serializes the object into a JSON format that includes its name,
   * description, properties, tools, and metadata. It is used for serialization
   * and transmission of the object state.
   *
   * @returns JSON representation of the ObjectInstance
   */
  public toJSON() {
    return {
      name: this.name,
      description: this.description,
      properties: this.properties,
      tools: (this.tools ?? []).map((tool) => tool.toJSON()),
      metadata: this.metadata,
    } satisfies ObjectInstance.JSON
  }
}
