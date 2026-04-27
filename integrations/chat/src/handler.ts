import { Request } from '@botpress/sdk'
import * as api from './api'
import { extraRoutes } from './extra-routes'
import { handleRequest, Router } from './gen/handler'
import { httpRequestsTotal, httpRequestDuration } from './metrics'
import { Handler } from './types'

const isPushpinRequest = (req: Request) => 'grip-sig' in req.headers

const apiRoutes = api.routes as Record<string, Record<string, api.Route>>
const routes = { ...apiRoutes, ...extraRoutes }
const router = new Router(Object.keys(routes))

export const makeHandler =
  (props: api.OperationTools): Handler =>
  async (args) => {
    if (args.req.method.toLowerCase() === 'options') {
      // preflight request
      return {
        status: 200,
      }
    }

    if (!isPushpinRequest(args.req)) {
      const message =
        'Chat API should be called from the chat domain "chat.botpress.cloud" not directly from the webhook domain "webhook.botpress.cloud".'
      return {
        status: 400,
        body: JSON.stringify({ message }),
      }
    }

    const match = router.match(args.req.path)
    const normalizedPath = match?.path ?? 'not_found'
    const method = args.req.method.toLowerCase()

    const { auth, signals, convIdStore, userIdStore, apiUtils } = props
    const start = performance.now()
    let statusCode = '500'
    try {
      const response = await handleRequest(routes, {
        ...args,
        auth,
        signals,
        convIdStore,
        userIdStore,
        apiUtils,
      })
      statusCode = String(response.status ?? 200)
      return response
    } finally {
      const durationSeconds = (performance.now() - start) / 1000
      httpRequestsTotal.inc({ method, status_code: statusCode, path: normalizedPath })
      httpRequestDuration.observe({ method, status_code: statusCode, path: normalizedPath }, durationSeconds)
    }
  }
