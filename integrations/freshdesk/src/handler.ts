import { timingSafeEqual } from 'crypto'
import { executeTicketCreated } from './events/ticketCreated'
import { executeTicketReplied } from './events/ticketReplied'
import { executeTicketUpdated } from './events/ticketUpdated'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger, ctx } = props
  const log = logger.forBot()

  log.info(`Webhook received: ${req.method} ${req.path}`)
  log.debug(`Webhook body: ${req.body ?? '(empty)'}`)

  const { webhookSecret } = ctx.configuration
  if (webhookSecret) {
    const providedSecret = req.headers?.['x-webhook-secret']
    const providedBuf = typeof providedSecret === 'string' ? Buffer.from(providedSecret, 'utf8') : null
    const secretBuf = Buffer.from(webhookSecret, 'utf8')
    const secretsMatch =
      providedBuf !== null && providedBuf.byteLength === secretBuf.byteLength && timingSafeEqual(providedBuf, secretBuf)
    if (!secretsMatch) {
      log.warn('Webhook received with invalid or missing secret, rejecting')
      return
    }
  }

  try {
    if (!req.body) {
      log.warn('Webhook received with empty body, ignoring')
      return
    }

    let body: Record<string, unknown>
    try {
      body = JSON.parse(req.body) as Record<string, unknown>
    } catch (e: unknown) {
      log.error(`Webhook body is not valid JSON: ${e instanceof Error ? e.message : String(e)}`)
      return
    }

    if (req.path === '/ticket-created') {
      log.debug(`Firing ticketCreated, ticket=${JSON.stringify(body['ticket'])}`)
      const result = await executeTicketCreated({ ...props, body })
      log.info('ticketCreated event fired successfully')
      return result
    }

    if (req.path === '/ticket-updated') {
      log.debug(`Firing ticketUpdated, ticket=${JSON.stringify(body['ticket'])}`)
      const result = await executeTicketUpdated({ ...props, body })
      log.info('ticketUpdated event fired successfully')
      return result
    }

    if (req.path === '/ticket-replied') {
      log.debug(`Firing ticketReplied, ticket=${JSON.stringify(body['ticket'])}`)
      const result = await executeTicketReplied({ ...props, body })
      log.info('ticketReplied event fired successfully')
      return result
    }

    log.warn(`Unhandled webhook path: ${req.path}`)
  } catch (e: unknown) {
    log.error(`Unhandled error in webhook handler: ${e instanceof Error ? e.message : String(e)}`)
  }
}
