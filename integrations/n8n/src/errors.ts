import * as sdk from '@botpress/sdk'
import axios from 'axios'

export const isNotFoundResponse = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 404

export const wrapN8nError = (error: unknown, context = 'n8n request'): never => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const detail = status ? `HTTP ${status}` : (error.code ?? error.message ?? 'network error')
    throw new sdk.RuntimeError(`${context} failed: ${detail}`)
  }
  throw new sdk.RuntimeError(error instanceof Error ? error.message : String(error))
}

export const wrapRegistrationError = (error: unknown, baseUrl: string): never => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const code = error.code
    const message = status ? `n8n responded with HTTP ${status}` : (code ?? error.message ?? 'network error')

    if (status === 401 || status === 403) {
      throw new sdk.RuntimeError(
        `Registration failed: authentication rejected (${message}). Check your Access Key and permissions.`
      )
    }

    if (status === 404) {
      throw new sdk.RuntimeError(
        `Registration failed: the n8n API was not found at ${baseUrl}/api/v1 (HTTP 404). Ensure your Base URL points to the root of your n8n instance (for example https://example.app.n8n.cloud).`
      )
    }

    throw new sdk.RuntimeError(
      `Registration failed: unable to reach n8n (${message}). Verify the Base URL is correct and reachable from this host.`
    )
  }

  const message = error instanceof Error ? error.message : String(error)
  throw new sdk.RuntimeError(`Registration failed: ${message}`)
}
