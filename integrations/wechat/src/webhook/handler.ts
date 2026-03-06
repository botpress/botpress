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

  /** Currently the Botpress backend parses numeric response bodies before
   *  sending it back to the http requester. Since the "echostr" is often a
   *  very long number, it gets truncated which causes the challenge to fail.
   *
   *  The work-around is to append a "|" suffix to the value to stop the number parse.
   *  Then we use a proxy to strip the suffix before sending it back to WeChat  */
  return _createTextResponse(200, `${echostr}|`)
}

const _createTextResponse = (status: number, body: string) => ({
  status,
  headers: {
    'Content-Type': 'text/plain',
  },
  body,
})
