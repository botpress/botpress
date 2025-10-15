import { type z } from '@botpress/sdk'
import * as bp from '.botpress'

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

export const parseRequestWithErrors = async <T>(req: bp.HandlerProps['req'], schema: z.ZodSchema<T>): Promise<T> => {
  let json: unknown
  try {
    json = JSON.parse(req.body ?? '')
  } catch (err) {
    throw new Error('BambooHR Webhook Request body is not valid JSON', err as Error)
  }

  try {
    return schema.parse(json)
  } catch (err) {
    throw new Error('Request body did not match expected format', err as Error)
  }
}
