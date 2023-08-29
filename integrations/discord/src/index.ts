import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import * as bp from '.botpress'

const integration = new bp.Integration({
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

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
