import { z } from '@bpinternal/zui'

import { formatTypings } from './formatting.js'
import { hoistTypings } from './hoist.js'
import { Tool } from './tool.js'
import { getTypings } from './typings.js'
import { escapeString, getMultilineComment, isValidIdentifier } from './utils.js'

/** How many lines of code an object needs to have before we insert a comment for end tag */
const LARGE_OBJECT_LINES_OF_CODE = 10

export type ObjectProperty = {
  name: string
  value: any
  type?: z.Schema
  description?: string
  writable?: boolean
}

export class ObjectInstance {
  public name: string
  public description?: string
  public properties?: ObjectProperty[]
  public tools?: Tool[]
  public metadata?: Record<string, unknown>

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

  public async getTypings() {
    return getObjectTypings(this).withProperties().withTools().build()
  }

  public toJSON() {
    return {
      name: this.name,
      description: this.description,
      properties: this.properties,
      tools: (this.tools ?? []).map((tool) => tool.toJSON()),
      metadata: this.metadata,
    }
  }
}

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
