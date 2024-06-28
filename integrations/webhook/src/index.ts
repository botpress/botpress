import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import qs from 'qs'
import * as bp from '.botpress'

type EventEvent = bp.events.event.Event
type Method = EventEvent['method']

const methods = {
  GET: null,
  POST: null,
} satisfies Record<Method, null>

const isMethod = (method: string): method is Method => method in methods

const integration = new bp.Integration({
  handler: async ({ req, client, ctx }) => {
    if (ctx.configuration.secret && req.headers['x-bp-secret'] !== ctx.configuration.secret) {
      throw new Error('Invalid secret')
    }

    const method = req.method.toUpperCase()
    if (!isMethod(method)) {
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
        query: query as Record<string, any>,
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

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
