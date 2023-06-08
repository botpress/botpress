import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import * as botpress from '.botpress'

sentryHelpers.init({
  dsn: botpress.secrets.SENTRY_DSN,
  environment: botpress.secrets.SENTRY_ENVIRONMENT,
  release: botpress.secrets.SENTRY_RELEASE,
})

const integration = new botpress.Integration({
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
