import jsonSchemaRefParser from '@apidevtools/json-schema-ref-parser'
import _ from 'lodash'

export interface LeafNode {
  type: Exclude<string, 'object'>
}

export interface UnionNode {
  anyOf: SchemaNode[]
}

export interface NestedNode {
  type: 'object'
  properties?: Dic<SchemaNode>
  additionalProperties?: SchemaNode
}

export type SchemaNode = NestedNode | LeafNode | UnionNode

export const ADD_PROP_KEY = 'ADDPROP'

const isUnion = (node: any): node is UnionNode => node.anyOf !== undefined

const isNested = (node: any): node is NestedNode =>
  node.type === 'object' && (node.properties !== undefined || node.additionalProperties !== undefined)

export function getPropertiesRecursive(node: SchemaNode, path: string = ''): string[] {
  if (isUnion(node)) {
    return _.flatMap(node.anyOf, value => getPropertiesRecursive(value, path))
  }
  if (isNested(node)) {
    return _(node.properties)
      .merge(node.additionalProperties ? { [ADD_PROP_KEY]: node.additionalProperties } : {})
      .entries()
      .filter(([k]) => !k.startsWith('$'))
      .flatMap(([key, value]) => getPropertiesRecursive(value, path.length ? `${path}.${key}` : key))
      .sort()
      .value()
  }
  return path ? [path] : []
}

function expandPath(path: string, data: any, knwonPaths: string[]): string[] {
  const idx = path.indexOf(ADD_PROP_KEY)
  const truncated = path.slice(0, idx - 1)

  const knownKeys = knwonPaths.filter(p => p.startsWith(truncated)).map(p => p.slice(truncated.length + 1))

  const expanded = _.chain(data)
    .get(truncated)
    .keys()
    .filter(key => !knownKeys.some(p => p.startsWith(key)))
    .map(k => path.replace(ADD_PROP_KEY, k))
    .thru(paths => (paths.length ? resolveAdditionalProperties(paths, data) : paths))
    .value()

  return [truncated, ...expanded]
}

function splitNeedsResolutionPaths(paths: string[]): [string[], string[]] {
  return paths.reduce(
    ([ok, need], next) => {
      if (next.includes(ADD_PROP_KEY)) {
        return [ok, [...need, next]]
      } else {
        return [[...ok, next], need]
      }
    },
    [[], []] as [string[], string[]]
  )
}

export function resolveAdditionalProperties(paths: string[], runtimeData: any): string[] {
  const [ok, needsResolve] = splitNeedsResolutionPaths(paths)
  return _(needsResolve)
    .flatMap(p => expandPath(p, runtimeData, ok))
    .uniq()
    .concat(ok)
    .sort()
    .value()
}

export function getValueFromEnvKey(key: string): any {
  try {
    return JSON.parse(process.env[key]!)
  } catch (err) {
    return process.env[key]
  }
}

/**
 *
 * @param schema valid json schema, may contain ref schemas
 * @param impl object implementing provided json schema interface
 * @returns all valid nested schema paths corresponding in impl
 */
export async function getValidJsonSchemaProperties(schema: SchemaNode, impl: object = {}): Promise<string[]> {
  // @ts-ignore
  schema = await jsonSchemaRefParser.dereference(schema)
  const propsWithPlaceHolder = getPropertiesRecursive(schema)
  return resolveAdditionalProperties(propsWithPlaceHolder, impl)
}
