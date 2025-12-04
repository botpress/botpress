import { createAsyncFnWrapperWithErrorRedaction, defaultErrorRedactor } from '@botpress/common'
import { RuntimeError } from '@botpress/sdk'

/**
 * Redacts sensitive information from MCP errors before exposing them to users.
 * URLs and server details are redacted to prevent leaking internal infrastructure info.
 */
export const redactMcpError = (error: Error): RuntimeError => {
  // Redact server URLs and API keys from error messages
  const redactedMessage = error.message
    .replace(/https?:\/\/[^\s]+/g, '[REDACTED_URL]')
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/apiKey[=:]\s*[^\s&]+/gi, 'apiKey=[REDACTED]')

  return new RuntimeError(`MCP Error: ${redactedMessage}`)
}

export const wrapWithTryCatch = createAsyncFnWrapperWithErrorRedaction(defaultErrorRedactor)

export class McpClientError extends Error {
  public constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(`[${operation}] ${message}`)
    this.name = 'McpClientError'
  }
}
