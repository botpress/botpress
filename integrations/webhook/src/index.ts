import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import qs from 'qs'
import { Integration, secrets } from '.botpress'

sentryHelpers.init({
  dsn: secrets.SENTRY_DSN,
  environment: secrets.SENTRY_ENVIRONMENT,
  release: secrets.SENTRY_RELEASE,
})

const integration = new Integration({
  handler: async ({ req, client, ctx }) => {
    if (ctx.configuration.secret && req.headers['x-bp-secret'] !== ctx.configuration.secret) {
      throw new Error('Invalid secret')
    }

    const method = req.method.toUpperCase()
    if (!['POST', 'GET'].includes(method)) {
      throw new Error('Invalid method')
    }

    const query = req.query ? qs.parse(req.query) : {}

    let body = {}
    try {
      body = JSON.parse(req.body ?? '{}')
    } catch (err) {}

    await client.createEvent({
      type: 'webhook:event',
      payload: {
        body,
        query,
        method,
        path: req.path,
      },
    })
  },
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {},
})

export default sentryHelpers.wrapIntegration(integration)
