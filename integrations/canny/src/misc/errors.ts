import { RuntimeError } from '@botpress/sdk'
import { isAxiosError } from 'axios'

export class InvalidAPIKeyError extends RuntimeError {
  public constructor() {
    super('Invalid Canny API key. Please check your API key in the integration settings.')
  }
}

export class InvalidRequestError extends RuntimeError {
  public constructor(thrown: unknown) {
    let message: string
    if (isAxiosError(thrown)) {
      message = thrown.response?.data?.error || thrown.message || 'Unknown error'
    } else {
      message = thrown instanceof Error ? thrown.message : String(thrown)
    }
    super(`Invalid request: ${message}`)
  }
}

export class CannyAPIError extends RuntimeError {
  public constructor(thrown: unknown) {
    let message: string
    if (isAxiosError(thrown)) {
      message = thrown.response?.data?.error || thrown.message || 'Unknown error'
    } else {
      message = thrown instanceof Error ? thrown.message : String(thrown)
    }
    super(`Canny API error: ${message}`)
  }
}
