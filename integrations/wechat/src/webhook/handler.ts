import { Request } from '@botpress/sdk'
import { processInboundChannelMessage } from '../channels/inbound'
import { verifyWebhookSignature } from './signature'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  if (!verifyWebhookSignature(props)) {
    return _createTextResponse(403, 'Invalid webhook signature')
  }

  const reqMethod = props.req.method
  if (reqMethod === 'GET') {
    return _handleWebhookChallenge(props.req)
  } else if (reqMethod === 'POST') {
    const result = await processInboundChannelMessage(props)
    if (!result.success) {
      props.logger.forBot().error(result.error.message)
      return _createTextResponse(500, 'Internal Server Error')
    }

    return _createTextResponse(200, result.data)
  }

  props.logger.forBot().warn(`Unhandled request type - ${reqMethod}`)
  return _createTextResponse(200, 'OK')
}

const _handleWebhookChallenge = (req: Request) => {
  const query = new URLSearchParams(req.query)
  const echostr = query.get('echostr') || ''

  // The "|" suffix may not be correct, but it was copied from the old implementation.
  // I'll see if it should be removed once I start QA testing the integration.
  return _createTextResponse(200, `${echostr}|`)
}

const _createTextResponse = (status: number, body: string) => ({
  status,
  headers: {
    'Content-Type': 'text/plain',
  },
  body,
})
