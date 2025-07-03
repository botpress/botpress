import { RuntimeError } from '@botpress/sdk'
import { ResponseError } from '@sendgrid/helpers/classes'
import { SendGridResponseError } from './custom-types'
import type * as bp from '.botpress'

export const isSendGridError = (thrown: unknown): thrown is SendGridResponseError => {
  return thrown instanceof ResponseError && typeof thrown.response.body === 'object' && 'errors' in thrown.response.body
}

export const parseError = (
  ctx: bp.HandlerProps['ctx'],
  thrown: unknown,
  sendGridErrorMessageOverride: string | null = null
) => {
  if (isSendGridError(thrown)) {
    if (sendGridErrorMessageOverride) {
      return new RuntimeError(sendGridErrorMessageOverride, thrown)
    }

    const errorMessage = thrown.response.body.errors[0]?.message ?? thrown.message

    if (errorMessage === 'Permission denied, wrong credentials' || thrown.code === 401) {
      const trimApiKey = ctx.configuration.apiKey.trim()
      const isApiKeyEmpty = trimApiKey.length === 0

      let cutoffPosition = trimApiKey.lastIndexOf('.')
      if (cutoffPosition === -1 || cutoffPosition >= trimApiKey.length - 1) {
        cutoffPosition = Math.max(0, trimApiKey.length / 2)
      }

      const errorMessage = isApiKeyEmpty
        ? 'No API key was sent to the SendGrid API'
        : `An invalid API key was sent to the SendGrid API\n${trimApiKey.slice(0, cutoffPosition)}`

      return new RuntimeError(errorMessage, thrown)
    }

    return new RuntimeError(
      `SendGrid API yielded an error with status code: "${thrown.code}", and message: "${errorMessage}"`,
      thrown
    )
  }

  if (thrown instanceof RuntimeError) {
    return thrown
  }

  return thrown instanceof Error ? new RuntimeError(thrown.message, thrown) : new RuntimeError(String(thrown))
}
