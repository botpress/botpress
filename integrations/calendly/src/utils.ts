import { type z } from '@botpress/sdk'
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
