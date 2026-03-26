import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import * as slackWebApi from '@slack/web-api'
import { Logger as BPLogger } from '.botpress'

export const redactSlackError = (thrown: unknown, genericErrorMessage: string): sdk.RuntimeError => {
  const error = thrown instanceof Error ? thrown : new Error(String(thrown))
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
        if ('data' in error && 'error' in (error.data as {})) {
          switch ((error.data as { error: string }).error) {
            case 'token_rotation_not_enabled':
              errorMessage +=
                ': Token rotation is not enabled. Please check your Slack app OAuth settings and opt in to token rotation.'
              break
            default:
              errorMessage += `: ${error.message}.\n\nError details:\n${JSON.stringify(error.data)}`
          }
        }
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

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction(redactSlackError)

export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)

export const surfaceSlackErrors = <TResponse extends slackWebApi.WebAPICallResult>({
  logger,
  response,
}: {
  logger: BPLogger
  response: TResponse
}): TResponse => {
  if (response.response_metadata?.warnings?.length) {
    logger.forBot().warn('Slack API emitted warnings', response.response_metadata.warnings)
  }

  if (response.error) {
    throw new sdk.RuntimeError(`Slack API error: ${response.error}`)
  }

  if (!response.ok) {
    throw new sdk.RuntimeError('Slack API returned an unspecified error')
  }

  return response
}
