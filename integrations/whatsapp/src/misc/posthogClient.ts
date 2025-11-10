import { INTEGRATION_NAME } from 'integration.definition'
import { EventMessage, PostHog } from 'posthog-node'
import * as bp from '.botpress'

type BotpressEventMessage = Omit<EventMessage, 'event'> & {
  event: BotpressEvent
}

type PostHogErrorOptions = {
  from: string
  integrationName: string
}

export const botpressEvents = {
  INVALID_PHONE_NUMBER: 'invalid_phone_number',
  UNHANDLED_MESSAGE_TYPE: 'unhandled_message_type',
  UNHANDLED_ERROR: 'unhandled_error',
} as const
type BotpressEvent = (typeof botpressEvents)[keyof typeof botpressEvents]

export const sendPosthogEvent = async (props: BotpressEventMessage): Promise<void> => {
  const client = new PostHog(bp.secrets.POSTHOG_KEY, {
    host: 'https://us.i.posthog.com',
  })
  try {
    const signedProps: BotpressEventMessage = {
      ...props,
      properties: {
        ...props.properties,
        integrationName: INTEGRATION_NAME,
      },
    }
    await client.captureImmediate(signedProps)
    await client.shutdown()
    console.info('PostHog event sent')
  } catch (thrown: any) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    console.error(`The server for posthog could not be reached - Error: ${errMsg}`)
  }
}

export const sendPosthogError = async (thrown: unknown, { from }: Partial<PostHogErrorOptions>): Promise<void> => {
  const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
  await sendPosthogEvent({
    distinctId: errMsg,
    event: botpressEvents.UNHANDLED_ERROR,
    properties: {
      from,
      integrationName: INTEGRATION_NAME,
    },
  })
}
