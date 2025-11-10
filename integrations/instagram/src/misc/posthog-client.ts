import { INTEGRATION_NAME } from 'integration.definition'
import { EventMessage, PostHog } from 'posthog-node'
import * as bp from '.botpress'

type BotpressEventMessage = Omit<EventMessage, 'event'> & {
  event: BotpressEvent
}

type PostHogErrorOptions = {
  from: string
  errorType?: BotpressEvent
}

export const botpressEvents = {
  UNHANDLED_ERROR: 'unhandled_error',
  UNHANDLED_MESSAGE: 'unhandled_message',
  INVALID_MESSAGE_FORMAT: 'invalid_message_format',
} as const
type BotpressEvent = (typeof botpressEvents)[keyof typeof botpressEvents]

const sendPosthogEvent = async (props: BotpressEventMessage): Promise<void> => {
  const client = new PostHog(bp.secrets.POSTHOG_KEY, {
    host: 'https://us.i.posthog.com',
  })
  try {
    await client.captureImmediate(props)
    await client.shutdown()
    console.info('PostHog event sent')
  } catch (thrown: any) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    console.error(`The server for posthog could not be reached - Error: ${errMsg}`)
  }
}

export const sendPosthogError = async (
  distinctId: string,
  errorMessage: string,
  { from, errorType = botpressEvents.UNHANDLED_ERROR }: PostHogErrorOptions
): Promise<void> => {
  await sendPosthogEvent({
    distinctId,
    event: errorType,
    properties: {
      from,
      integrationName: INTEGRATION_NAME,
      message: errorMessage,
    },
  })
}
