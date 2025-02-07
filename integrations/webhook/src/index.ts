import { RuntimeError } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import qs from 'qs'
import { getCorsHeaders } from './cors'
import * as bp from '.botpress'

type EventEvent = bp.events.event.Event
type Method = EventEvent['method']

const methods = {
  GET: null,
  POST: null,
} satisfies Record<Method, null>

const isMethod = (method: string): method is Method => method in methods

const truncate = (str: string, maxLength: number = 500): string =>
  str.length > maxLength ? `${str.slice(0, maxLength)}...` : str
const debugRequest = ({ req, logger }: bp.HandlerProps): void => {
  const { method, path, query, body } = req
  const fullPath = query ? `${path}?${query}` : path
  const debug = truncate(`${method} ${fullPath} ${JSON.stringify(body)}`)
  logger.forBot().debug('Received webhook request:', debug)
}

const integration = new bp.Integration({
  handler: async (args) => {
    debugRequest(args)

    const corsHeaders = getCorsHeaders(args)

    if (args.req.method.toLowerCase() === 'options') {
      // preflight request
      return {
        status: 200,
        headers: corsHeaders,
      }
    }

    const { req, client, ctx } = args

    if (ctx.configuration.secret && req.headers['x-bp-secret'] !== ctx.configuration.secret) {
      throw new RuntimeError('The provided secret is invalid.')
    }

    const method = req.method.toUpperCase()
    if (!isMethod(method)) {
      throw new RuntimeError('Only GET and POST methods are supported.')
    }

    const query = req.query ? qs.parse(req.query) : {}

    let body = {}
    try {
      body = JSON.parse(req.body ?? '{}')
    } catch {}

    await client.createEvent({
      type: 'webhook:event',
      payload: {
        body,
        query: query as Record<string, any>,
        method,
        path: req.path,
      },
    })

    return {
      status: 200,
      headers: corsHeaders,
    }
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
