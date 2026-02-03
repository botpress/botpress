import { Result } from './types'

export const safeParseJson = (json: string): Result<object> => {
  try {
    return {
      success: true,
      data: JSON.parse(json),
    } as const
  } catch (thrown: unknown) {
    return {
      success: false,
      error: thrown instanceof Error ? thrown : new Error(String(thrown)),
    } as const
  }
}

export const safeParseRequestBody = (body: string | undefined): Result<object> => {
  if (!body?.trim()) {
    return {
      success: false,
      error: new Error('Request body is empty'),
    }
  }

  return safeParseJson(body)
}
