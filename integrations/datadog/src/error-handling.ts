import { isApiError } from '@botpress/client'
import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator, posthogHelper } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from '../integration.definition'
import * as bp from '.botpress'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error: Error, customMessage: string) => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }

  const datadogError = _extractDatadogError(error)
  const redactedMessage = datadogError ? `${customMessage}: ${datadogError}` : customMessage

  const errorMessage = error.message || String(error)
  const distinctId = isApiError(error) ? error.id : undefined
  const statusCode = _isHttpError(error) ? _getStatusCode(error) : undefined
  const errorReason = _isHttpError(error) ? _getErrorReason(error) : undefined

  posthogHelper
    .sendPosthogEvent(
      {
        distinctId: distinctId ?? 'no id',
        event: 'datadog_api_error',
        properties: {
          from: 'datadog_client',
          errorMessage: customMessage,
          datadogError: datadogError?.substring(0, 200) || errorMessage.substring(0, 200),
          statusCode: statusCode?.toString(),
          errorReason: errorReason?.substring(0, 100),
        },
      },
      {
        integrationName: INTEGRATION_NAME,
        integrationVersion: INTEGRATION_VERSION,
        key: (bp.secrets as any).POSTHOG_KEY as string,
      }
    )
    .catch(() => {
      // Silently fail if PostHog is unavailable
    })

  console.warn(customMessage, error)
  return new sdk.RuntimeError(redactedMessage)
})

export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)

type HttpError = Error & {
  response?: {
    status?: number
    statusCode?: number
    statusText?: string
    data?: any
    body?: any
  }
  status?: number | string
  statusCode?: number
}

const _extractDatadogError = (error: Error): string | null => {
  if (_isHttpError(error)) {
    const errorBody = _getErrorBody(error)
    if (errorBody?.errors) {
      return Array.isArray(errorBody.errors) ? errorBody.errors.join(', ') : JSON.stringify(errorBody.errors)
    }
    if (errorBody?.error) {
      return errorBody.error.message || errorBody.error.detail || JSON.stringify(errorBody.error)
    }
    if (errorBody?.message) {
      return errorBody.message
    }
  }
  return null
}

const _isHttpError = (error: Error): error is HttpError => {
  return 'response' in error || 'status' in error || 'statusCode' in error
}

const _getStatusCode = (error: HttpError): number | undefined => {
  if ('response' in error && error.response) {
    return error.response.status || error.response.statusCode
  }
  if ('status' in error) {
    return error.status as number
  }
  if ('statusCode' in error) {
    return error.statusCode as number
  }
  return undefined
}

const _getErrorReason = (error: HttpError): string | undefined => {
  if ('response' in error && error.response) {
    return error.response.statusText
  }
  return undefined
}

const _getErrorBody = (error: HttpError): any => {
  if ('response' in error && error.response) {
    return error.response.data || error.response.body
  }
  return undefined
}
