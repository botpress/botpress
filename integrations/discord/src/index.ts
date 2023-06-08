import { Integration } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { secrets } from '.botpress'

sentryHelpers.init({
  dsn: secrets.SENTRY_DSN,
  environment: secrets.SENTRY_ENVIRONMENT,
  release: secrets.SENTRY_RELEASE,
})

const integration = new Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async () => {},
        image: async () => {},
        markdown: async () => {},
        audio: async () => {},
        video: async () => {},
        file: async () => {},
        location: async () => {},
        carousel: async () => {},
        card: async () => {},
        dropdown: async () => {},
        choice: async () => {},
      },
    },
  },
  handler: async () => {},
})

export default sentryHelpers.wrapIntegration(integration)
