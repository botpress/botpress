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
    const valuesToTry = [valueToValidate]

    // Also try alternative value if available and different
    if (alternativeValue !== undefined && alternativeValue !== valueToValidate) {
      valuesToTry.push(alternativeValue)
    }

    for (const candidateValue of valuesToTry) {
      const isValuePrimitive =
        candidateValue === null ||
        candidateValue === undefined ||
        typeof candidateValue !== 'object' ||
        Array.isArray(candidateValue)

      // For ZodObject schemas, try wrapping primitives in property names
      if (schemaType === 'ZodObject' && isValuePrimitive) {
        const possibleWraps: Array<Record<string, unknown>> = []

        // First, try properties that actually exist in the schema
        const shape = schema.shape
        if (shape && typeof shape === 'object') {
          for (const key of Object.keys(shape)) {
            possibleWraps.push({ [key]: candidateValue })
          }
        }

        // Then try common property names that might not be in the schema yet
        const commonNames = ['result', 'value', 'data', 'message', 'error', 'output', 'response']
        for (const name of commonNames) {
          // Avoid duplicates
          if (!possibleWraps.some((w) => Object.keys(w)[0] === name)) {
            possibleWraps.push({ [name]: candidateValue })
          }
        }

        for (const wrap of possibleWraps) {
          const testParse = schema.safeParse(wrap)
          if (testParse.success) {
            valueToValidate = wrap
            parsed = testParse
            break
          }
        }
        if (parsed.success) break
      }

      // Use the candidate value for the union wrapping below if we haven't found a match yet
      if (!parsed.success && candidateValue !== valueToValidate) {
        valueToValidate = candidateValue
      }
    }

    // Recalculate these after the loop since valueToValidate might have changed
    const isValuePrimitive =
      valueToValidate === null ||
      valueToValidate === undefined ||
      typeof valueToValidate !== 'object' ||
      Array.isArray(valueToValidate)
    const isValueObject =
      valueToValidate !== null && typeof valueToValidate === 'object' && !Array.isArray(valueToValidate)

    // For discriminated unions and regular unions (like DefaultExit), try to fit the data
    // Note: Discriminated unions may become regular unions after JSON Schema round-trip
    if ((schemaType === 'ZodDiscriminatedUnion' || schemaType === 'ZodUnion') && !parsed.success) {
      const options = schema._def.options

      // For ZodDiscriminatedUnion, we have an explicit discriminator
      // For ZodUnion from a discriminated union, we need to detect it from the options
      let discriminator = schema._def.discriminator

      // If no explicit discriminator (ZodUnion), try to detect one from common literal fields
      if (!discriminator && options.length > 0 && options[0]._def.typeName === 'ZodObject') {
        const firstShape = options[0].shape
        // Find fields that are literals in all options
        for (const key in firstShape) {
          const firstFieldType = firstShape[key]._def.typeName
          if (firstFieldType === 'ZodLiteral') {
            // Check if all options have this as a literal
            const allHaveLiteral = options.every((opt: any) => opt.shape[key]?._def.typeName === 'ZodLiteral')
            if (allHaveLiteral) {
              discriminator = key
              break
            }
          }
        }
      }

      if (discriminator) {
        // If the value is an object but missing the discriminator, try to add it
        // ONLY if exactly one option matches (otherwise it's ambiguous)
        if (isValueObject && !(discriminator in (valueToValidate as object))) {
          const matchingOptions: Array<{ option: any; discriminatorValue: any; wrappedValue: any }> = []

          // Find all options that would match if we added the discriminator
          for (const option of options) {
            if (option._def.typeName === 'ZodObject' && option.shape[discriminator]) {
              const discriminatorValue = option.shape[discriminator]._def.value
              const wrappedValue = { [discriminator]: discriminatorValue, ...(valueToValidate as object) }
              const testParse = schema.safeParse(wrappedValue)
              if (testParse.success) {
                matchingOptions.push({ option, discriminatorValue, wrappedValue })
              }
            }
          }

          // Only apply the discriminator if exactly one option matches
          if (matchingOptions.length === 1) {
            valueToValidate = matchingOptions[0]!.wrappedValue
            parsed = schema.safeParse(valueToValidate)
          }
          // If multiple options match, it's ambiguous - don't auto-fix, let it fail
        }

        // If the value is primitive, try wrapping it in each union option
        // Only succeed if exactly one wrapping works (otherwise ambiguous)
        if (isValuePrimitive && !parsed.success) {
          const allSuccessfulWraps: Array<{ wrap: Record<string, unknown>; option: any }> = []

          for (const option of options) {
            if (option._def.typeName === 'ZodObject' && option.shape[discriminator]) {
              const discriminatorValue = option.shape[discriminator]._def.value
              const possibleWraps: Array<Record<string, unknown>> = []

              // First, try properties that actually exist in this union option's schema
              const shape = option.shape
              if (shape && typeof shape === 'object') {
                for (const key of Object.keys(shape)) {
                  if (key !== discriminator) {
                    // Skip the discriminator itself
                    possibleWraps.push({ [discriminator]: discriminatorValue, [key]: valueToValidate })
                  }
                }
              }

              // Then try common property names
              const commonNames = ['result', 'value', 'data', 'message', 'error', 'output', 'response']
              for (const name of commonNames) {
                // Avoid duplicates
                const alreadyHas = possibleWraps.some(
                  (w) => Object.keys(w).includes(name) && Object.keys(w).includes(discriminator)
                )
                if (!alreadyHas) {
                  possibleWraps.push({ [discriminator]: discriminatorValue, [name]: valueToValidate })
                }
              }

              for (const wrap of possibleWraps) {
                const testParse = schema.safeParse(wrap)
                if (testParse.success) {
                  allSuccessfulWraps.push({ wrap, option })
                  break // Only keep the first successful wrap per option
                }
              }
            }
          }

          // Only apply if exactly one wrap succeeded (unambiguous)
          if (allSuccessfulWraps.length === 1) {
            valueToValidate = allSuccessfulWraps[0]!.wrap
            parsed = schema.safeParse(valueToValidate)
          }
          // If multiple wraps succeeded, it's ambiguous - let it fail
        }
      }
    }
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
