import { PostHog } from 'posthog-node'
import * as bp from '.botpress'

type BotpressEventMessage = {
  distinctId: string
  event: PostHogEvent
  properties?: Record<string | number, any>
}

let postHogClient: PostHog | undefined
const getOrCreatePostHogClient = (): PostHog => {
  if (postHogClient === undefined) {
    postHogClient = new PostHog(bp.secrets.POSTHOG_KEY, {
      host: 'https://us.i.posthog.com',
    })
  }
  return postHogClient
}

export const postHogEvents = {
  INVALID_PHONE_NUMBER: 'invalid_phone_number',
  UNHANDLED_MESSAGE_TYPE: 'unhandled_message_type',
} as const
type PostHogEvent = (typeof postHogEvents)[keyof typeof postHogEvents]

export const posthogCapture = async (props: BotpressEventMessage): Promise<void> => {
  const client = getOrCreatePostHogClient()
  client.capture(props)
  await client
    .flush()
    .then(() => console.info('PostHog flush completed'))
    .catch((err) => console.error(`The server for posthog could not be reached - Error: ${err}`))
}
