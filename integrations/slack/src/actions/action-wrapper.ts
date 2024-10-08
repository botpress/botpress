import { RuntimeError } from '@botpress/sdk'
import { WebClient, ErrorCode } from '@slack/web-api'
import { getAccessToken } from '../misc/utils'
import { IntegrationProps } from '.botpress'

type Actions = {
  [K in keyof IntegrationProps['actions']]: IntegrationProps['actions'][K]
}
type ActionInjections = { slackClient: WebClient }
type ActionWithInjections = {
  [K in keyof Actions]: (
    props: Parameters<Actions[K]>[0] & ActionInjections,
    input: Parameters<Actions[K]>[0]['input']
  ) => ReturnType<Actions[K]>
}

const tryCatch = async <T>(fn: () => Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await fn()
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(`${thrown}`)

    // log the unredacted error to the @botpresshub integration logs:
    console.error(errorMessage, error)

    // log the redacted error to the bot logs & studio:
    throw _redactSlackError(error, errorMessage)
  }
}

const _redactSlackError = (error: Error, genericErrorMessage: string): RuntimeError => {
  let errorMessage = genericErrorMessage

  if ('code' in error) {
    switch (error.code) {
      case ErrorCode.RequestError:
      case ErrorCode.HTTPError:
        errorMessage +=
          ': an HTTP error occurred whilst communicating with Slack. Please report this error to Botpress.'
        break
      case ErrorCode.PlatformError:
        errorMessage += `: ${error.message}.\n\nError details:\n${JSON.stringify((error as any).data ?? {})}`
        break
      case ErrorCode.RateLimitedError:
        errorMessage += ': Slack rate limited the request. Please try again later.'
        break
      default:
        console.warn(`Unhandled Slack error code: ${error.code}`, error)
        break
    }
  }

  return new RuntimeError(errorMessage)
}

export const wrapActionAndInjectSlackClient = <K extends keyof Actions>(
  actionName: K,
  {
    action,
    errorMessage,
  }: {
    action: ActionWithInjections[K]
    errorMessage: string
  }
): Actions[K] =>
  (async (props: Parameters<Actions[K]>[0]) => {
    const accessToken = await getAccessToken(props.client, props.ctx)
    const slackClient = new WebClient(accessToken)
    const injections = { slackClient }

    return tryCatch(() => {
      props.logger.forBot().debug(`Running action "${actionName}" [bot id: ${props.ctx.botId}]`)

      return action({ ...props, ...injections }, props.input)
    }, errorMessage)
  }) as unknown as Actions[K]
