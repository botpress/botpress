import { type z } from '@botpress/sdk'

export type ParseResult<T> = { success: true; data: T } | { success: false; error: string; details?: unknown }

export const parseResponseWithErrors = async <T>(res: Response, schema: z.ZodSchema<T>): Promise<ParseResult<T>> => {
  let json: unknown
  try {
    json = await res.json()
  } catch (thrown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))

    return {
      success: false,
      error: 'BambooHR API response is not valid JSON',
      details: err,
    }
  }

  try {
    const data = schema.parse(json)
    return { success: true, data }
  } catch (err) {
    return {
      success: false,
      error: 'BambooHR API response did not match expected format',
      details: err,
    }
  }
}

export const safeParseJson = <T>(str: string): ParseResult<T> => {
  try {
    const parsed = JSON.parse(str)
    return { success: true, data: parsed }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown.message : String(thrown)
    return { success: false, error }
  }
}
