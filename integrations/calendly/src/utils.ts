import { RuntimeError, z, ZodError } from '@botpress/sdk'
import axios, { type AxiosInstance } from 'axios'
import { Result } from './types'

const BASE_URL = 'https://api.calendly.com' as const

export type CalendlyClient = AxiosInstance & z.BRAND<'CalendlyApiClient'>
export function createCalendlyClient(authToken: string, baseURL: string = BASE_URL): CalendlyClient {
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  }) as CalendlyClient
}

const _isZodError = (error: any): error is ZodError => {
  return error && typeof error === 'object' && error instanceof ZodError && 'errors' in error
}

export function parseError(thrown: unknown): RuntimeError {
  if (axios.isAxiosError(thrown)) {
    return new RuntimeError(thrown.response?.data?.message || thrown.message)
  }

  if (_isZodError(thrown)) {
    return new RuntimeError(thrown.errors.map((e) => e.message).join(', '))
  }

  if (thrown instanceof RuntimeError) {
    return thrown
  }

  return thrown instanceof Error ? new RuntimeError(thrown.message) : new RuntimeError(String(thrown))
}

export const safeParseJson = (json: string): Result<unknown> => {
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
