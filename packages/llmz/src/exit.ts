import { transforms } from '@bpinternal/zui'
import { JSONSchema7 } from 'json-schema'
import { uniq } from 'lodash-es'
import { ZuiType } from './types.js'
import { isJsonSchema, isValidIdentifier } from './utils.js'

export type ExitResult<T = unknown> = {
  exit: Exit<T>
  result: T
}

export class Exit<T = unknown> {
  public name: string
  public aliases: string[] = []
  public description: string
  public metadata: Record<string, unknown>
  public schema?: JSONSchema7

  public get zSchema() {
    return this.schema ? transforms.fromJSONSchemaLegacy(this.schema) : undefined
  }

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

  public clone() {
    return new Exit({
      name: this.name,
      aliases: [...this.aliases],
      description: this.description,
      metadata: JSON.parse(JSON.stringify(this.metadata)),
      schema: this.zSchema,
    })
  }

  public is<T>(exit: Exit<T>): this is Exit<T> {
    return this.name === exit.name
  }

  public match(result: ExitResult): result is ExitResult<T> {
    return result.exit instanceof Exit && this.name === result.exit.name
  }

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
      if (props.schema && 'toJsonSchema' in props.schema && typeof props.schema.toJsonSchema === 'function') {
        this.schema = props.schema.toJsonSchema()
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
