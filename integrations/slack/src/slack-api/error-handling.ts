import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import * as slackWebApi from '@slack/web-api'

const _redactSlackError = (error: Error, genericErrorMessage: string): sdk.RuntimeError => {
  let errorMessage = genericErrorMessage

  console.error('Slack error', { error, genericErrorMessage })

  if (error instanceof sdk.RuntimeError) {
    return error
  }

  if ('code' in error) {
    switch (error.code) {
      case slackWebApi.ErrorCode.RequestError:
      case slackWebApi.ErrorCode.HTTPError:
        errorMessage +=
          ': an HTTP error occurred whilst communicating with Slack. Please report this error to Botpress.'
        break
      case slackWebApi.ErrorCode.PlatformError:
        errorMessage += `: ${error.message}.\n\nError details:\n${JSON.stringify((error as any).data ?? {})}`
        break
      case slackWebApi.ErrorCode.RateLimitedError:
        errorMessage += ': Slack rate limited the request. Please try again later.'
        break
      default:
        console.warn(`Unhandled Slack error code: ${error.code}`, error)
        break
    }
  }

  return new sdk.RuntimeError(errorMessage)
}

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction(_redactSlackError)

export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)
