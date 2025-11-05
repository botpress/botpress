import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { channels } from './channels'
import { handler } from './handler'
import { actions } from './actions'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async ({ client, ctx }) => {
    const adminId = ctx.configuration.adminId
    await client.updateUser({
      id: ctx.botUserId,
      tags: { id: adminId },
    })
  },
  unregister: async () => {},
  actions,
  channels,
  handler,
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
