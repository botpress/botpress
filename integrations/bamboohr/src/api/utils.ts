import { type z } from '@botpress/sdk'
import * as bp from '.botpress'

export const parseResponseWithErrors = async <T>(res: Response, schema: z.ZodSchema<T>): Promise<T> => {
  let json: unknown
  try {
    json = await res.json()
  } catch (err) {
    throw new Error('BambooHR API response is not valid JSON', err as Error)
  }

  try {
    return schema.parse(json)
  } catch (err) {
    throw new Error('BambooHR API response did not match expected format', err as Error)
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
