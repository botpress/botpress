import * as sdk from '@botpress/sdk'
import * as uuid from 'uuid'
import { logger } from './logger'
import * as types from './types'

type Request = sdk.Request
type Response = sdk.Response | void

const requestId = () => {
  const v4 = uuid.v4()
  const short = v4.substring(0, 8)
  return short
}

export const debugRequest = (req: Request) => {
  const id = requestId()
  const headersSummary = req.headers ? `headers=${summarize(JSON.stringify(req.headers))}` : 'headers=empty'
  const bodySummary = req.body ? `body=${summarize(req.body)}` : 'body=empty'
  logger.info(`[${id}] Incoming request ${req.method} ${req.path} ${headersSummary} ${bodySummary}`)
  return id
}

const summarize = (text: string, len = 400) => {
  return text.length > len ? `${text.substring(0, len)}...` : text
}

export const debugResponse = (id: string, res: Response) => {
  if (!res) {
    logger.info(`[${id}] Outgoing response empty`)
    return
  }
  const headersSummary = res.headers ? `headers=${summarize(JSON.stringify(res.headers))}` : 'headers=empty'
  const bodySummary = res.body ? `body=${summarize(res.body)}` : 'body=empty'
  logger.info(`[${id}] Outgoing response ${res.status} ${headersSummary} ${bodySummary}`)
}

export const debugSignal = (args: types.MessageArgs | types.ActionArgs) => {
  if ('input' in args) {
    logger.debug(
      `Sending signal conversationId=${args.input.conversationId} event=${summarize(
        JSON.stringify(args.input.payload)
      )} user=${args.ctx.botUserId}`
    )
  } else {
    logger.debug(
      `Sending signal conversationId=${args.conversation.id} message=${summarize(JSON.stringify(args.message))} user=${
        args.user.id
      }`
    )
  }
}
