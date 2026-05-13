import { executeAgentReplied } from './events/agentReplied'
import { executeTicketCreated } from './events/ticketCreated'
import { executeTicketUpdated } from './events/ticketUpdated'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props
  const log = logger.forBot()

  log.info(`Webhook received: ${req.method} ${req.path}`)
  log.info(`Webhook body: ${req.body ?? '(empty)'}`)

  try {
    if (!req.body) {
      log.warn('Webhook received with empty body, ignoring')
      return
    }

    let body: Record<string, unknown>
    try {
      body = JSON.parse(req.body) as Record<string, unknown>
    } catch (e) {
      log.error(`Webhook body is not valid JSON: ${String(e)}`)
      return
    }

    if (req.path === '/ticket-created') {
      log.info(`Firing ticketCreated, ticket=${JSON.stringify(body['ticket'])}`)
      const result = await executeTicketCreated({ ...props, body })
      log.info('ticketCreated event fired successfully')
      return result
    }

    if (req.path === '/ticket-updated') {
      log.info(`Firing ticketUpdated, ticket=${JSON.stringify(body['ticket'])}`)
      const result = await executeTicketUpdated({ ...props, body })
      log.info('ticketUpdated event fired successfully')
      return result
    }

    if (req.path === '/agent-replied') {
      log.info(`Firing agentReplied, ticket=${JSON.stringify(body['ticket'])}`)
      const result = await executeAgentReplied({ ...props, body })
      log.info('agentReplied event fired successfully')
      return result
    }

    log.warn(`Unhandled webhook path: ${req.path}`)
  } catch (e) {
    log.error(`Unhandled error in webhook handler: ${e instanceof Error ? e.message : String(e)}`)
    throw e
  }
}
