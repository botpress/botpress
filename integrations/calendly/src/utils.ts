import { RuntimeError, z } from '@botpress/sdk'
import axios, { type AxiosInstance } from 'axios'

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

export function parseError(thrown: unknown): RuntimeError {
  if (axios.isAxiosError(thrown)) {
    return new RuntimeError(thrown.response?.data?.message || thrown.message)
  }

  if (thrown instanceof RuntimeError) {
    return thrown
  }

  return thrown instanceof Error ? new RuntimeError(thrown.message) : new RuntimeError(String(thrown))
}
