import { omit } from 'lodash-es'
import { Exit } from './exit.js'

/**
 * Result of parsing an exit from return value
 */
export type ParsedExit =
  | {
      success: true
      exit: Exit
      value: unknown
    }
  | {
      success: false
      error: string
      returnValue: unknown
    }

/**
 * Checks if a value is primitive (not an object or is an array/null)
 */
function isValuePrimitive(value: unknown): boolean {
  return value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)
}

/**
 * Generates possible wraps for a primitive value in an object schema
 */
function generatePossibleWraps(
  value: unknown,
  shape: Record<string, any> | undefined,
  discriminator?: string
): Array<Record<string, unknown>> {
  const possibleWraps: Array<Record<string, unknown>> = []
  const commonNames = ['result', 'value', 'data', 'message', 'error', 'output', 'response']

  // First, try properties that actually exist in the schema
  if (shape && typeof shape === 'object') {
    for (const key of Object.keys(shape)) {
      if (key !== discriminator) {
        const wrap = discriminator
          ? { [discriminator]: shape[discriminator]._def.value, [key]: value }
          : { [key]: value }
        possibleWraps.push(wrap)
      }
    }
  }

  // Then try common property names
  for (const name of commonNames) {
    const hasName = possibleWraps.some((w) => Object.keys(w).includes(name))
    if (!hasName) {
      const wrap =
        discriminator && shape?.[discriminator]
          ? { [discriminator]: shape[discriminator]._def.value, [name]: value }
          : { [name]: value }
      possibleWraps.push(wrap)
    }
  }

  return possibleWraps
}

/**
 * Tries to wrap a primitive value in object schemas
 */
function tryObjectWrapping(
  schema: any,
  candidateValue: unknown
): {
  success: boolean
  valueToValidate: unknown
  parsed: any
} {
  const possibleWraps = generatePossibleWraps(candidateValue, schema.shape)

  for (const wrap of possibleWraps) {
    const testParse = schema.safeParse(wrap)
    if (testParse.success) {
      return { success: true, valueToValidate: wrap, parsed: testParse }
    }
  }

  return { success: false, valueToValidate: candidateValue, parsed: { success: false } }
}

/**
 * Detects discriminator field from union options
 */
function detectDiscriminator(options: any[]): string | undefined {
  if (options.length === 0 || options[0]._def.typeName !== 'ZodObject') {
    return undefined
  }

  const firstShape = options[0].shape
  for (const key in firstShape) {
    const firstFieldType = firstShape[key]._def.typeName
    if (firstFieldType === 'ZodLiteral') {
      const allHaveLiteral = options.every((opt: any) => opt.shape[key]?._def.typeName === 'ZodLiteral')
      if (allHaveLiteral) {
        return key
      }
    }
  }

  return undefined
}

/**
 * Tries to add missing discriminator to object values
 */
function tryAddDiscriminator(
  schema: any,
  options: any[],
  discriminator: string,
  valueToValidate: unknown
): { success: boolean; valueToValidate: unknown; parsed: any } {
  const matchingOptions: Array<{ wrappedValue: any }> = []

  for (const option of options) {
    if (option._def.typeName === 'ZodObject' && option.shape[discriminator]) {
      const discriminatorValue = option.shape[discriminator]._def.value
      const wrappedValue = { [discriminator]: discriminatorValue, ...(valueToValidate as object) }
      const testParse = schema.safeParse(wrappedValue)
      if (testParse.success) {
        matchingOptions.push({ wrappedValue })
      }
    }
  }

  if (matchingOptions.length === 1) {
    const wrapped = matchingOptions[0]!.wrappedValue
    return { success: true, valueToValidate: wrapped, parsed: schema.safeParse(wrapped) }
  }

  return { success: false, valueToValidate, parsed: { success: false } }
}

/**
 * Tries to wrap primitive in union options
 */
function tryUnionPrimitiveWrapping(
  schema: any,
  options: any[],
  discriminator: string,
  valueToValidate: unknown
): { success: boolean; valueToValidate: unknown; parsed: any } {
  const allSuccessfulWraps: Array<{ wrap: Record<string, unknown> }> = []

  for (const option of options) {
    if (option._def.typeName === 'ZodObject' && option.shape[discriminator]) {
      const discriminatorValue = option.shape[discriminator]._def.value
      const possibleWraps = generatePossibleWraps(valueToValidate, option.shape, discriminator)

      for (const wrap of possibleWraps) {
        const finalWrap = { [discriminator]: discriminatorValue, ...wrap }
        const testParse = schema.safeParse(finalWrap)
        if (testParse.success) {
          allSuccessfulWraps.push({ wrap: finalWrap })
          break
        }
      }
    }
  }

  if (allSuccessfulWraps.length === 1) {
    const wrapped = allSuccessfulWraps[0]!.wrap
    return { success: true, valueToValidate: wrapped, parsed: schema.safeParse(wrapped) }
  }

  return { success: false, valueToValidate, parsed: { success: false } }
}

/**
 * Tries smart wrapping for union schemas
 */
function tryUnionWrapping(
  schema: any,
  valueToValidate: unknown
): { success: boolean; valueToValidate: unknown; parsed: any } {
  const options = schema._def.options
  let discriminator = schema._def.discriminator

  if (!discriminator) {
    discriminator = detectDiscriminator(options)
  }

  if (!discriminator) {
    return { success: false, valueToValidate, parsed: { success: false } }
  }

  const isValueObject =
    valueToValidate !== null && typeof valueToValidate === 'object' && !Array.isArray(valueToValidate)
  const isPrimitive = isValuePrimitive(valueToValidate)

  // Try adding discriminator to objects
  if (isValueObject && !(discriminator in (valueToValidate as object))) {
    const result = tryAddDiscriminator(schema, options, discriminator, valueToValidate)
    if (result.success) {
      return result
    }
  }

  // Try wrapping primitives
  if (isPrimitive) {
    return tryUnionPrimitiveWrapping(schema, options, discriminator, valueToValidate)
  }

  return { success: false, valueToValidate, parsed: { success: false } }
}

/**
 * Attempts various smart wrapping strategies to fit data to schema
 */
function trySmartWrapping(
  schema: any,
  schemaType: string,
  valueToValidate: unknown,
  alternativeValue: unknown
): { valueToValidate: unknown; parsed: any } {
  const valuesToTry = [valueToValidate]

  if (alternativeValue !== undefined && alternativeValue !== valueToValidate) {
    valuesToTry.push(alternativeValue)
  }

  for (const candidateValue of valuesToTry) {
    const isPrimitive = isValuePrimitive(candidateValue)

    // For ZodObject schemas, try wrapping primitives
    if (schemaType === 'ZodObject' && isPrimitive) {
      const result = tryObjectWrapping(schema, candidateValue)
      if (result.success) {
        return result
      }
    }
  }

  // Update valueToValidate to alternative if available
  if (alternativeValue !== undefined && alternativeValue !== valueToValidate) {
    valueToValidate = alternativeValue
  }

  // For union schemas, try union-specific wrapping
  if (schemaType === 'ZodDiscriminatedUnion' || schemaType === 'ZodUnion') {
    const result = tryUnionWrapping(schema, valueToValidate)
    if (result.success) {
      return result
    }
  }

  return { valueToValidate, parsed: { success: false } }
}

/**
 * Parses and validates a return value against a list of exits.
 * Attempts to intelligently fit the data to the expected schema.
 *
 * @param returnValue - The raw return value from code execution
 * @param exits - Available exits to match against
 * @returns Parsed exit result with validated data or error
 *
 * @example
 * ```typescript
 * const exits = [
 *   new Exit({ name: 'done', schema: z.object({ result: z.string() }) })
 * ]
 *
 * // Returns primitive value - will be smart-wrapped
 * const result = parseExit({ action: 'done', data: 'hello' }, exits)
 * // result.success === true
 * // result.value === { result: 'hello' }
 * ```
 */
export function parseExit(returnValue: { action: string; [key: string]: unknown } | null, exits: Exit[]): ParsedExit {
  if (!returnValue) {
    return {
      success: false,
      error: 'No return value provided',
      returnValue,
    }
  }

  const returnAction = returnValue.action
  if (!returnAction) {
    return {
      success: false,
      error: `Code did not return an action. Valid actions are: ${exits.map((x) => x.name).join(', ')}`,
      returnValue,
    }
  }

  // Find exit by name or alias (case-insensitive)
  const returnExit =
    exits.find((x) => x.name.toLowerCase() === returnAction.toLowerCase()) ??
    exits.find((x) => x.aliases.some((a) => a.toLowerCase() === returnAction.toLowerCase()))

  if (!returnExit) {
    return {
      success: false,
      error: `Exit "${returnAction}" not found. Valid actions are: ${exits.map((x) => x.name).join(', ')}`,
      returnValue,
    }
  }

  // If exit has no schema, accept any value
  if (!returnExit.zSchema) {
    const otherProps = omit(returnValue, 'action')
    const value = Object.keys(otherProps).length === 1 ? Object.values(otherProps)[0] : otherProps
    return {
      success: true,
      exit: returnExit,
      value,
    }
  }

  // Extract the value to validate - could be in .value or other properties
  let valueToValidate = returnValue.value
  let alternativeValue: unknown = undefined

  // If value is undefined but there are other properties besides 'action', use those
  if (valueToValidate === undefined) {
    const otherProps = omit(returnValue, 'action')
    if (Object.keys(otherProps).length > 0) {
      // Prefer keeping as object to allow discriminator matching
      // Only extract single value if it's truly a single value, not an object with one property
      valueToValidate = otherProps
      if (Object.keys(otherProps).length === 1) {
        alternativeValue = Object.values(otherProps)[0]
      }
    }
  }

  // Smart wrapping: Try to fit the data into the expected schema
  const schema = returnExit.zSchema as any // Type assertion needed due to Zui type complexity
  const schemaType = schema._def.typeName

  // First, try to parse as-is
  let parsed = schema.safeParse(valueToValidate)

  // If that failed and we have an alternative (extracted value), try that too
  if (!parsed.success && alternativeValue !== undefined && alternativeValue !== valueToValidate) {
    const altParsed = schema.safeParse(alternativeValue)
    if (altParsed.success) {
      parsed = altParsed
      valueToValidate = alternativeValue
    }
  }

  // If parsing failed, try smart wrapping (even for null/undefined in some cases)
  if (!parsed.success) {
    const result = trySmartWrapping(schema, schemaType, valueToValidate, alternativeValue)
    valueToValidate = result.valueToValidate
    parsed = result.parsed
  }

  if (!parsed.success) {
    // Helper to get type description of a value
    const getValueTypeDescription = (val: unknown): string => {
      if (val === null) return 'null'
      if (val === undefined) return 'undefined'
      if (Array.isArray(val)) return 'array'
      return typeof val
    }

    // Build what was generated statement
    const generatedType = getValueTypeDescription(valueToValidate)
    let generatedStatement = `return { action: '${returnAction}'`

    // Add the property that was used
    if (returnValue.value !== undefined) {
      generatedStatement += `, value: ${generatedType}`
    } else {
      const otherProps = omit(returnValue, 'action')
      const propKeys = Object.keys(otherProps)
      if (propKeys.length === 1) {
        generatedStatement += `, ${propKeys[0]}: ${generatedType}`
      } else if (propKeys.length > 1) {
        generatedStatement += `, ${propKeys.join(', ')}`
      }
    }
    generatedStatement += ' }'

    // Build expected return statements for each exit
    const expectedStatements: string[] = []

    for (const exit of exits) {
      let statement = `return { action: '${exit.name}'`

      if (exit.zSchema) {
        const schema = exit.zSchema as any
        const typeName = schema._def.typeName

        if (typeName === 'ZodObject') {
          const shape = schema.shape
          const properties = Object.keys(shape).map((key) => {
            const field = shape[key]
            const fieldType = field._def.typeName || 'unknown'
            const isOptional = field.isOptional?.() || false
            return `${key}${isOptional ? '?' : ''}: ${fieldType.replace('Zod', '').toLowerCase()}`
          })
          statement += `, value: { ${properties.join(', ')} }`
        } else if (typeName === 'ZodUnion' || typeName === 'ZodDiscriminatedUnion') {
          const options = schema._def.options || []
          const variants = options.map((opt: any) => {
            if (opt._def.typeName === 'ZodObject') {
              const shape = opt.shape
              const properties = Object.keys(shape).map((key) => {
                const field = shape[key]
                const fieldType = field._def.typeName || 'unknown'
                return `${key}: ${fieldType.replace('Zod', '').toLowerCase()}`
              })
              return `{ ${properties.join(', ')} }`
            }
            return 'unknown'
          })
          statement += `, value: ${variants.join(' | ')}`
        } else {
          const schemaTypeName = typeName?.replace('Zod', '').toLowerCase() || 'unknown'
          statement += `, value: ${schemaTypeName}`
        }
      }

      statement += ' }'
      expectedStatements.push(statement)
    }

    const errorMessage = [
      `Invalid return value for exit "${returnExit.name}"`,
      '',
      'You generated:',
      `  ${generatedStatement}`,
      '',
      'But expected one of:',
      ...expectedStatements.map((s) => `  ${s}`),
    ].join('\n')

    return {
      success: false,
      error: errorMessage,
      returnValue,
    }
  }

  return {
    success: true,
    exit: returnExit,
    value: parsed.data,
  }
}
