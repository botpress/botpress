import { EventMessage, PostHog } from 'posthog-node'
import * as bp from '.botpress'

type BotpressEventMessage = Omit<EventMessage, 'event'> & {
  event: BotpressEvent
}

export const botpressEvents = {
  UNHANDLED_MARKDOWN: 'unhandled_markdown',
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
  } catch (thrown: any) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    console.error(`The server for posthog could not be reached - Error: ${errMsg}`)
  }
}
