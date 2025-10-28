import { PostHog } from 'posthog-node'
import * as bp from '.botpress'

export const postHogEvents = {
  INVALID_PHONE_NUMBER: 'invalid_phone_number',
  UNHANDLED_MESSAGE_TYPE: 'unhandled_message_type',
} as const

let posthogClient: PostHog | undefined
export const getOrCreatePosthogClient = () => {
  if (!posthogClient) {
    posthogClient = new PostHog(bp.secrets.POSTHOG_KEY, {
      host: 'https://us.i.posthog.com',
    })
  }
  return posthogClient
}
