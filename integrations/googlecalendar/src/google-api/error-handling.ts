import { isApiError } from '@botpress/client'
import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator, posthogHelper } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { Common as GoogleApisCommon } from 'googleapis'
import { INTEGRATION_NAME } from 'integration.definition'
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
        event: 'google_calendar_api_error',
        properties: {
          from: 'google_calendar_client',
          errorMessage: customMessage,
          googleError: googleError?.substring(0, 200) || errorMessage.substring(0, 200),
          statusCode: statusCode?.toString(),
          errorReason: errorReason?.substring(0, 100),
        },
      },
      { integrationName: INTEGRATION_NAME, key: (bp.secrets as any).POSTHOG_KEY as string }
    )
    .catch(() => {
      // Silently fail if PostHog is unavailable
    })

  console.warn(customMessage, error)
  return new sdk.RuntimeError(redactedMessage)
})

export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)

const _extractGoogleApiError = (error: Error) =>
  _isGaxiosError(error)
    ? error['errors']
        .map((err: { message: string }) => err.message)
        .join(', ')
        .replaceAll(/Invalid requests\[0\].[a-zA-Z]+:/g, '')
    : null

// For some reason, the Google API typing for GaxiosError does not correspond
// to the actual error object returned by the API. It is missing the `errors`
// field which contains the actual error messages. This type is a workaround
// to properly type the error object.
type AggregateGAxiosError = GoogleApisCommon.GaxiosError & { errors: Error[] }

const _isGaxiosError = (error: Error): error is AggregateGAxiosError =>
  'errors' in error && Array.isArray(error['errors'])
