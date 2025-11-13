import { isAxiosError } from 'axios'

export function parseError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response) {
      if (typeof error.response.data === 'string') {
        return `Request failed with status ${error.response.status}: ${error.response.data}`
      }
      return `Request failed with status ${error.response.status}: ${error.message}`
    }
    if (error.request) {
      return `No response received: ${error.message}`
    }
    return `Axios error: ${error.message}`
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string' || typeof error === 'number' || typeof error === 'boolean') {
    return String(error)
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = error.message
    return parseError(message)
  }

  return 'An unexpected error occurred'
}
