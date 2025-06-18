import { RuntimeError, ZodError } from '@botpress/sdk'
import sgMail from '@sendgrid/mail'
import * as bp from '../../.botpress'
import { SendGridResponseError } from './custom-types'
import { zodErrorToRuntimeError } from './validation-utils'

export const initializeSendGrid = (config: bp.configuration.Configuration) => {
  sgMail.setApiKey(config.apiKey)
}

export const isSendGridError = (thrown: any): thrown is SendGridResponseError => {
  return (
    'code' in thrown &&
    'response' in thrown &&
    'body' in thrown.response &&
    typeof thrown.response.body === 'object' &&
    'errors' in thrown.response.body
  )
}

export const isZodError = (error: any): error is ZodError => {
  return error && error instanceof ZodError
}

export const parseError = (thrown: any) => {
  if (isSendGridError(thrown)) {
    const errorMessage = thrown.response.body.errors[0]?.message ?? thrown.message
    return new RuntimeError(
      `SendGrid API yielded an error with status code: "${thrown.code}", and message: "${errorMessage}"`,
      thrown
    )
  }

  if (isZodError(thrown)) {
    return zodErrorToRuntimeError(thrown)
  }

  if (thrown instanceof RuntimeError) {
    return thrown
  }

  return thrown instanceof Error ? new RuntimeError(thrown.message, thrown) : new RuntimeError(String(thrown))
}
