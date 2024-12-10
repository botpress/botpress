import { Request } from '@botpress/sdk'
import * as api from './api'
import { extraRoutes } from './extra-routes'
import { handleRequest } from './gen/handler'
import { Handler } from './types'

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
