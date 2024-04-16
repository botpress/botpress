import { RuntimeError } from '@botpress/client'
import { ZodError } from '@botpress/sdk'
import { GaxiosError } from 'googleapis-common'

export function isGaxiosError(error: any): error is GaxiosError {
  if (error?.response?.message?.length > 0) {
    return true
  }
  return false
}

export const isZodError = (error: any): error is ZodError => {
  return error && typeof error === 'object' && error instanceof ZodError && 'errors' in error
}

export const parseError = (error: any): RuntimeError => {
  if (isGaxiosError(error)) {
    return new RuntimeError(error.message, error)
  }

  if (isZodError(error)) {
    return new RuntimeError(`Output does not conform to expected schema: ${error.message}`, error)
  }

  return new RuntimeError(error?.message)
}
