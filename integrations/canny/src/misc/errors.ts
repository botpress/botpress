import { RuntimeError } from '@botpress/sdk'

export class InvalidAPIKeyError extends RuntimeError {
  constructor() {
    super('Invalid Canny API key. Please check your API key in the integration settings.')
  }
}

export class InvalidRequestError extends RuntimeError {
  constructor(axiosError: any) {
    super(`Invalid request: ${axiosError.response?.data?.error || axiosError.message}`)
  }
}

export class CannyAPIError extends RuntimeError {
  constructor(axiosError: any) {
    super(`Canny API error: ${axiosError.response?.data?.error || axiosError.message || 'Unknown error'}`)
  }
}
