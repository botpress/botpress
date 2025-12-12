import { isApiError } from '@botpress/client'
import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator, posthogHelper } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { Common as GoogleApisCommon } from 'googleapis'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import * as bp from '.botpress'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error: Error, customMessage: string) => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }

  const googleError = _extractGoogleApiError(error)
  const redactedMessage = googleError ? `${customMessage}: ${googleError}` : customMessage

  const errorMessage = error.message || String(error)
  const distinctId = isApiError(error) ? error.id : undefined
  const statusCode = _isGaxiosError(error) ? error.response?.status : undefined
  const errorReason = _isGaxiosError(error) ? error.response?.statusText : undefined

  posthogHelper
    .sendPosthogEvent(
      {
        distinctId: distinctId ?? 'no id',
        event: 'api_error',
        properties: {
          from: 'gmail_client',
          errorMessage: customMessage,
          googleError: googleError?.substring(0, 200) || errorMessage.substring(0, 200),
          statusCode: statusCode?.toString(),
          errorReason: errorReason?.substring(0, 100),
        },
      },
      { integrationName: INTEGRATION_NAME, integrationVersion: INTEGRATION_VERSION, key: bp.secrets.POSTHOG_KEY }
    )
    .catch(() => {
      // Silently fail if PostHog is unavailable
    })

  return new sdk.RuntimeError(redactedMessage)
})

export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)

/*
  Since emails can be quite sensitive, by default we will not expose the
  original error message to the user, instead replacing it with a generic
  message if we're not given a RuntimeError. This is done by the default
  error redactor function.
*/
export const wrapWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error: Error, customMessage: string) => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }
  // For action/channel wrappers, we use a more generic error message
  return new sdk.RuntimeError(customMessage)
})

const _extractGoogleApiError = (error: Error) =>
  _isGaxiosError(error)
    ? error['errors']
        .map((err: { message: string }) => err.message)
        .join(', ')
        .replaceAll(/Invalid requests\[0\].[a-zA-Z]+:/g, '')
    : null

type AggregateGAxiosError = GoogleApisCommon.GaxiosError & { errors: Error[] }

const _isGaxiosError = (error: Error): error is AggregateGAxiosError =>
  'errors' in error && Array.isArray(error['errors'])
