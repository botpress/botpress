import { EventMessage, PostHog } from 'posthog-node'
import * as bp from '.botpress'

type BotpressEventMessage = Omit<EventMessage, 'event'> & {
  event: BotpressEvent
}

type PostHogErrorOptions = {
  from: string
  botId: string
  integrationId: string
}

export const botpressEvents = {
  INVALID_PHONE_NUMBER: 'invalid_phone_number',
  UNHANDLED_MESSAGE_TYPE: 'unhandled_message_type',
} as const
type BotpressEvent = (typeof botpressEvents)[keyof typeof botpressEvents]

export const sendPosthogEvent = async (props: BotpressEventMessage): Promise<void> => {
  const client = new PostHog(bp.secrets.POSTHOG_KEY, {
    host: 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
  try {
    await client.captureImmediate(props)
    await client.shutdown()
    console.info('PostHog event sent')
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    console.error(`The server for posthog could not be reached - Error: ${errMsg}`)
  }
}

export const sendPosthogError = async (thrown: unknown, properties: PostHogErrorOptions): Promise<void> => {
  const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
  const client = new PostHog(bp.secrets.POSTHOG_KEY, {
    host: 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
  try {
    await client.captureExceptionImmediate(thrown, errMsg, properties)
    await client.shutdown()
    console.info('PostHog error sent')
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    console.error(`The server for posthog could not be reached - Error: ${errMsg}`)
  }
}
