import type { ComponentRegistry } from './registry.js'
import type { DiagnosticCode, JsonSchema, NormalizedComponentDefinition, ParsedItem } from './types.js'

export type ComponentValidationError = {
  code: Extract<
    DiagnosticCode,
    | 'unknown-component'
    | 'missing-required-prop'
    | 'unexpected-prop'
    | 'invalid-prop-value'
    | 'body-not-allowed'
    | 'missing-required-body'
  >
  message: string
  path?: string
}

export type ComponentValidationResult = {
  valid: boolean
  props: Record<string, unknown>
  errors: ComponentValidationError[]
}

type ValidatableItem = Pick<ParsedItem, 'name' | 'props' | 'body'>

/**
 * Validates a syntactically parsed `■send` item against the registered
 * component definitions. Validation is intentionally separate from parsing: a
 * validation failure never stops the stream, it only produces errors the caller
 * can turn into diagnostics or fallback rendering.
 */
export function validateComponent(item: ValidatableItem, registry: ComponentRegistry): ComponentValidationResult {
  const definition = registry.get(item.name)

  if (!definition) {
    const registered =
      registry
        .list()
        .map((d) => d.name)
        .join(', ') || '(none)'
    return {
      valid: false,
      props: item.props,
      errors: [
        {
          code: 'unknown-component',
          message: `Unknown component "${item.name}". Registered components: ${registered}`,
        },
      ],
    }
  }

  const errors: ComponentValidationError[] = [
    ..._validateProps(item.props, definition),
    ..._validateBody(item, definition),
  ]

  return { valid: errors.length === 0, props: item.props, errors }
}

/** Validates a props object against a JSON schema (also used for `■next` exit props). */
export function validateProps(props: Record<string, unknown>, schema: JsonSchema): ComponentValidationError[] {
  const errors: ComponentValidationError[] = []
  _checkValue(props, schema, '', errors)
  return errors
}

const _validateProps = (
  props: Record<string, unknown>,
  definition: NormalizedComponentDefinition
): ComponentValidationError[] => validateProps(props, definition.propsJsonSchema)

const _validateBody = (
  item: ValidatableItem,
  definition: NormalizedComponentDefinition
): ComponentValidationError[] => {
  const hasBody = typeof item.body === 'string' && item.body.length > 0

  if (hasBody && !definition.body) {
    return [
      {
        code: 'body-not-allowed',
        message: `Component "${definition.name}" does not support a body`,
      },
    ]
  }

  if (!hasBody && definition.body?.required) {
    return [
      {
        code: 'missing-required-body',
        message: `Component "${definition.name}" requires a body`,
      },
    ]
  }

  return []
}

const _typeOf = (value: unknown): string => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

const _matchesType = (value: unknown, type: string): boolean => {
  switch (type) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number'
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'null':
      return value === null
    case 'array':
      return Array.isArray(value)
    case 'object':
      return !!value && typeof value === 'object' && !Array.isArray(value)
    default:
      return true
  }
}

const _isEqual = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

/**
 * Minimal JSON-schema subset checker covering what component schemas need:
 * type, enum, const, required, properties, additionalProperties, items, anyOf/oneOf.
 * Unknown keywords are ignored (lenient by design).
 */
const _checkValue = (
  value: unknown,
  schema: JsonSchema | boolean | undefined,
  path: string,
  errors: ComponentValidationError[]
): void => {
  if (schema === undefined || typeof schema === 'boolean' || typeof schema !== 'object') {
    return
  }

  const label = path || 'props'
  const propError = (message: string): void => {
    errors.push({ code: 'invalid-prop-value', message, path: path || undefined })
  }

  if (schema.const !== undefined && !_isEqual(value, schema.const)) {
    propError(`Expected "${label}" to equal ${JSON.stringify(schema.const)}`)
    return
  }

  if (schema.enum && !schema.enum.some((allowed) => _isEqual(value, allowed))) {
    propError(`Expected "${label}" to be one of: ${schema.enum.map((v) => JSON.stringify(v)).join(', ')}`)
    return
  }

  const variants = schema.anyOf ?? schema.oneOf
  if (variants?.length) {
    const matchesAny = variants.some((variant) => {
      const variantErrors: ComponentValidationError[] = []
      _checkValue(value, variant as JsonSchema, path, variantErrors)
      return variantErrors.length === 0
    })
    if (!matchesAny) {
      propError(`Value of "${label}" does not match any of the allowed types`)
      return
    }
  }

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type]
    if (!types.some((type) => _matchesType(value, type))) {
      propError(`Expected "${label}" to be of type ${types.join(' | ')}, but got ${_typeOf(value)}`)
      return
    }
  }

  if (Array.isArray(value) && schema.items && !Array.isArray(schema.items)) {
    value.forEach((item, index) => _checkValue(item, schema.items as JsonSchema, `${label}[${index}]`, errors))
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    const properties = schema.properties ?? {}

    for (const requiredKey of schema.required ?? []) {
      if (record[requiredKey] === undefined) {
        errors.push({
          code: 'missing-required-prop',
          message: `Missing required prop "${path ? `${path}.` : ''}${requiredKey}"`,
          path: path ? `${path}.${requiredKey}` : requiredKey,
        })
      }
    }

    for (const [key, propValue] of Object.entries(record)) {
      const propSchema = properties[key]
      const propPath = path ? `${path}.${key}` : key

      if (propSchema === undefined) {
        if (schema.additionalProperties === false) {
          errors.push({
            code: 'unexpected-prop',
            message: `Unexpected prop "${propPath}"`,
            path: propPath,
          })
        }
        continue
      }

      _checkValue(propValue, propSchema as JsonSchema, propPath, errors)
    }
  }
}
