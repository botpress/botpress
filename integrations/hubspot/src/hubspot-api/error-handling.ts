import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator } from '@botpress/common'
import * as sdk from '@botpress/sdk'

type HubspotApiError = Error & {
  code: number
  body?: {
    policyName?: string
    message?: string
  }
}

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error: Error, customMessage: string) => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }

  console.warn(customMessage, error)

  if (_isHubspotApiError(error)) {
    return new sdk.RuntimeError(
      `${customMessage}. HubSpot API responded with status code ${error.code}${
        error.body?.message ? ` and message: ${error.body.message}` : ''
      }${error.body?.policyName ? ` (policy: ${error.body.policyName})` : ''}`
    )
  }

  return new sdk.RuntimeError(customMessage)
})

const _isHubspotApiError = (error: unknown): error is HubspotApiError => {
  return error instanceof Error && 'code' in error && typeof (error as any).code === 'number'
}

export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)
