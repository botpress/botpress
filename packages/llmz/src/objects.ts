import { z } from '@bpinternal/zui'

import { formatTypings } from './formatting.js'
import { hoistTypings } from './hoist.js'
import { ToolImplementation } from './tools.js'
import { getTypings } from './typings.js'
import { Identifier, escapeString, getMultilineComment } from './utils.js'

const SchemaType = z.custom<z.Schema>((value) => value instanceof z.Schema)

/** How many lines of code an object needs to have before we insert a comment for end tag */
const LARGE_OBJECT_LINES_OF_CODE = 10

export type ObjectProperty = z.TypeOf<typeof ObjectProperty>
const ObjectProperty = z.object({
  name: Identifier,
  value: z.any(),
  type: SchemaType.optional(),
  description: z.string().optional(),
  writable: z.boolean().default(false).optional(),
})

export type ObjectDefinition = z.input<typeof ObjectDefinition>
export type ObjectInstance = z.output<typeof ObjectDefinition>

const ObjectDefinition = z.object({
  name: Identifier,
  description: z.string().optional(),
  properties: z.array(ObjectProperty).min(0).max(100).optional().default([]),
  tools: z.array(ToolImplementation).min(0).max(100).optional().default([]),
})

const instanceMap = new WeakMap<object, true>()
export const makeObject = (props: ObjectDefinition): ObjectInstance => {
  const obj = ObjectDefinition.parse(props)
  instanceMap.set(obj, true)
  return obj
}

export const ObjectInstance = z.custom<ObjectInstance>((value: any) => instanceMap.has(value!), {
  message: 'Objects must be created with llmz `makeObject`',
})

export function getObjectTypings(obj: ObjectInstance) {
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
        const input = tool.input
        const output = tool.output ?? z.void()

        const fnType = z
          .function(input as any, output)
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

export namespace Objects {
  export type Definition = ObjectDefinition
  export type Instance = ObjectInstance
  export type Property = ObjectProperty
}
