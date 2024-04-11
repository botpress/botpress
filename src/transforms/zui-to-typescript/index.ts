import { type JSONSchema4 } from 'json-schema'
import { cloneDeep, endsWith, merge, isEqual } from 'lodash-es'
import { generate } from './generator'
import { link } from './linker'
import { normalize } from './normalizer'
import { optimize } from './optimizer'
import { validateOptions } from './optionValidator'
import { parse } from './parser'
import { dereference } from './resolver'
import { error, log } from './utils'
import { validate } from './validator'

export type { EnumJSONSchema, JSONSchema, NamedEnumJSONSchema, CustomTypeJSONSchema } from './types/JSONSchema'

export interface Options {
  /**
   * [$RefParser](https://github.com/BigstickCarpet/json-schema-ref-parser) Options, used when resolving `$ref`s
   */
  $refOptions: any
  /**
   * Default value for additionalProperties, when it is not explicitly set.
   */
  additionalProperties: boolean
  /**
   * Disclaimer comment prepended to the top of each generated file.
   */
  bannerComment: string
  /**
   * Root directory for resolving [`$ref`](https://tools.ietf.org/id/draft-pbryan-zyp-json-ref-03.html)s.
   */
  cwd: string
  /**
   * Declare external schemas referenced via `$ref`?
   */
  declareExternallyReferenced: boolean
  /**
   * Prepend enums with [`const`](https://www.typescriptlang.org/docs/handbook/enums.html#computed-and-constant-members)?
   */
  enableConstEnums: boolean
  /**
   * Format code? Set this to `false` to improve performance.
   */
  format: boolean
  /**
   * Ignore maxItems and minItems for `array` types, preventing tuples being generated.
   */
  ignoreMinAndMaxItems: boolean
  /**
   * Maximum number of unioned tuples to emit when representing bounded-size array types,
   * before falling back to emitting unbounded arrays. Increase this to improve precision
   * of emitted types, decrease it to improve performance, or set it to `-1` to ignore
   * `minItems` and `maxItems`.
   */
  maxItems: number
  /**
   * Append all index signatures with `| undefined` so that they are strictly typed.
   *
   * This is required to be compatible with `strictNullChecks`.
   */
  strictIndexSignatures: boolean
  /**
   * Generate code for `definitions` that aren't referenced by the schema?
   */
  unreachableDefinitions: boolean
  /**
   * Generate unknown type instead of any
   */
  unknownAny: boolean
}

export const DEFAULT_OPTIONS: Options = {
  $refOptions: {},
  additionalProperties: true, // TODO: default to empty schema (as per spec) instead
  bannerComment: '',
  cwd: '',
  declareExternallyReferenced: true,
  enableConstEnums: true,
  format: true,
  ignoreMinAndMaxItems: false,
  maxItems: 20,
  strictIndexSignatures: false,
  unreachableDefinitions: false,
  unknownAny: true,
}

export async function compile(schema: JSONSchema4, name = 'Root', options: Partial<Options> = {}): Promise<string> {
  validateOptions(options)
  const _options = merge({}, DEFAULT_OPTIONS, options)

  const start = Date.now()
  function time() {
    return `(${Date.now() - start}ms)`
  }

  // normalize options
  if (!endsWith(_options.cwd, '/')) {
    _options.cwd += '/'
  }

  // Initial clone to avoid mutating the input
  const _schema = cloneDeep(schema)

  const { dereferencedPaths, dereferencedSchema } = await dereference(_schema, _options)
  if (process.env.VERBOSE) {
    if (isEqual(_schema, dereferencedSchema)) {
      log('green', 'dereferencer', time(), '✅ No change')
    } else {
      log('green', 'dereferencer', time(), '✅ Result:', dereferencedSchema)
    }
  }

  const linked = link(dereferencedSchema)
  if (process.env.VERBOSE) {
    log('green', 'linker', time(), '✅ No change')
  }

  const errors = validate(linked, name)
  if (errors.length) {
    errors.forEach((_) => error(_))
    throw new ValidationError()
  }
  if (process.env.VERBOSE) {
    log('green', 'validator', time(), '✅ No change')
  }

  const normalized = normalize(linked, dereferencedPaths, name, _options)
  log('yellow', 'normalizer', time(), '✅ Result:', normalized)

  const parsed = parse(normalized, _options)
  log('blue', 'parser', time(), '✅ Result:', parsed)

  const optimized = optimize(parsed, _options)
  log('cyan', 'optimizer', time(), '✅ Result:', optimized)

  const generated = generate(optimized, _options)
  log('magenta', 'generator', time(), '✅ Result:', generated)
  return generated
}

export class ValidationError extends Error {}

type ToTypescriptTyingsOptions = { schemaName: string } & Partial<Options>

export type { ToTypescriptTyingsOptions }

export const toTypescriptTypings = async (jsonSchema: any, options?: ToTypescriptTyingsOptions) => {
  const generatedType = await compile(jsonSchema, options?.schemaName ?? 'Schema', {
    bannerComment: '',
    ...options,
  })

  return !options?.schemaName
    ? generatedType.replace('export interface Schema ', '').replace('export type Schema = ', '')
    : generatedType
}
