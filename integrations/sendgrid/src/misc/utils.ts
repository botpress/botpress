import { RuntimeError } from '@botpress/sdk'
import { ResponseError } from '@sendgrid/helpers/classes'
import { SendGridResponseError } from './custom-types'

export const isSendGridError = (thrown: unknown): thrown is SendGridResponseError => {
  return thrown instanceof ResponseError && typeof thrown.response.body === 'object' && 'errors' in thrown.response.body
}

export const parseError = (thrown: unknown, sendGridErrorMessageOverride: string | null = null) => {
  if (isSendGridError(thrown)) {
    if (sendGridErrorMessageOverride) {
      return new RuntimeError(sendGridErrorMessageOverride, thrown)
    }

    const errorMessage = thrown.response.body.errors[0]?.message ?? thrown.message
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
