import { transforms, z } from '@bpinternal/zui'
import type { JSONSchema7 } from 'json-schema'
import { InvalidConfigurationError, isLLMzError } from './errors.js'

const INPUT_SCHEMA_OPTIONS = { target: 'openApi3', effectStrategy: 'input', pipeStrategy: 'input' } as const

/** Describe values supplied to a schema; JavaScript effects remain in the original validator. */
export function toModelSchema(schema: z.ZodType): JSONSchema7 {
  try {
    return transforms.toJSONSchema(schema)
  } catch {
    try {
      return transforms.toJSONSchemaLegacy(schema, INPUT_SCHEMA_OPTIONS)
    } catch (cause) {
      throw new InvalidConfigurationError(`Cannot describe schema input: ${String(cause)}`, { cause })
    }
  }
}

/** Async tool inputs still run their validator exactly once, including before retries. */
export async function parseSchemaAsync<T extends z.ZodType>(schema: T, value: unknown, subject: string) {
  try {
    return await schema.safeParseAsync(value)
  } catch (cause) {
    if (isLLMzError(cause)) {
      throw cause
    }

    throw new InvalidConfigurationError(`${subject} schema evaluation failed: ${String(cause)}`, { cause })
  }
}

/** Exit, component and property APIs are synchronous. Tool inputs use safeParseAsync instead. */
export function parseSchemaSync<T extends z.ZodType>(schema: T, value: unknown, subject: string) {
  try {
    return schema.safeParse(value)
  } catch (cause) {
    if (isLLMzError(cause)) {
      throw cause
    }

    throw new InvalidConfigurationError(
      `${subject} schema could not be evaluated synchronously. Use synchronous transforms and refinements here; put asynchronous validation in a tool input schema. ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause }
    )
  }
}

/** Unwrap root effects without executing them or losing the original schema. */
export function schemaInput(schema: z.ZodType): z.ZodType {
  if (z.is.zuiEffects(schema)) {
    return schemaInput(schema.innerType())
  }

  return z.is.zuiPipeline(schema) ? schemaInput(schema._def.in) : schema
}
