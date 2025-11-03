import { PostHog } from 'posthog-node'
import * as bp from '.botpress'

type BotpressEventMessage = {
  distinctId: string
  event: PostHogEvent
  properties?: Record<string | number, any>
}

let postHogClient: PostHog | undefined
const _getOrCreatePostHogClient = (): PostHog => {
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
  UNHANDLED_ERROR: 'unhandled_error',
} as const
type PostHogEvent = (typeof postHogEvents)[keyof typeof postHogEvents]

export const posthogCapture = async (props: BotpressEventMessage): Promise<void> => {
  const client = _getOrCreatePostHogClient()
  client.capture(props)
  await client
    .flush()
    .then(() => console.info('PostHog flush completed'))
    .catch((thrown: any) => {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      console.error(`[Flush] The server for posthog could not be reached - Error: ${errMsg}`)
    })
}

export const posthogShutdown = async () => {
  const client = _getOrCreatePostHogClient()
  await client
    .shutdown()
    .then(() => console.info('PostHog shutdown completed'))
    .catch((thrown: any) => {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      console.error(`[Shutdown] The server for posthog could not be reached - Error: ${errMsg}`)
    })
}
