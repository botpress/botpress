import { Request } from '@botpress/sdk'
import * as api from './api'
import { extraRoutes } from './extra-routes'
import * as errors from './gen/errors'
import { handleRequest } from './gen/handler'
import { Handler } from './types'
import * as websocket from './websocket'

const isPushpinRequest = (req: Request) => 'grip-sig' in req.headers

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

    if (websocket.isWebSocketRequest(args.req) && args.req.body) {
      try {
        return await websocket.handleWebSocketRequest(props, args.req)
      } catch (thrown: unknown) {
        if (errors.isApiError(thrown)) {
          return {
            status: thrown.code,
            body: JSON.stringify(thrown.toJSON()),
          }
        }
        return {
          status: 500,
          body: JSON.stringify({
            message: thrown instanceof Error ? thrown.message : 'Unknown error',
          }),
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
