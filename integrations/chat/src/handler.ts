import { Request } from '@botpress/sdk'
import qs from 'qs'
import * as api from './api'
import { extraRoutes } from './extra-routes'
import { handleRequest } from './gen/handler'
import * as grip from './grip'
import { Handler } from './types'

const isPushpinRequest = (req: Request) => 'grip-sig' in req.headers

const isPushpinWebSocketRequest = (req: Request) => {
  if (req.method.toLowerCase() !== 'post') {
    return false
  }
  const parts = req.path.split('/').splice(1)
  if (parts.length !== 3) {
    return false
  }
  return parts[0] === 'conversations' && parts[2] === 'listen'
}

const convertPushpinWebSocketRequest = (req: Request): Request => {
  if (!req.body) {
    return req
  }
  req.body = JSON.stringify({ events: grip.parseWebSocketEvents(Buffer.from(req.body)) })
  const queries = qs.parse(req.query)
  if (queries['x-user-key'] && typeof queries['x-user-key'] === 'string') {
    req.headers['x-user-key'] = queries['x-user-key']
  }
  return req
}

export const makeHandler =
  (props: api.OperationTools): Handler =>
  async (args) => {
    const apiRoutes = api.routes as Record<string, Record<string, api.Route>>
    const routes = { ...apiRoutes, ...extraRoutes }

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

    if (isPushpinWebSocketRequest(args.req) && args.req.body) {
      try {
        args.req = convertPushpinWebSocketRequest(args.req)
      } catch {
        return {
          status: 400,
          body: JSON.stringify({ message: 'Malformed request payload' }),
        }
      }
    }

    const { auth, signals, convIdStore, userIdStore, apiUtils } = props
    return handleRequest(routes, {
      ...args,
      auth,
      signals,
      convIdStore,
      userIdStore,
      apiUtils,
    })
  }
