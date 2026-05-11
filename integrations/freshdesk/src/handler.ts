import { executeAgentReplied } from './events/agentReplied'
import { executeTicketCreated } from './events/ticketCreated'
import { executeTicketUpdated } from './events/ticketUpdated'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req } = props

  if (!req.body) {
    return
  }

  const body = JSON.parse(req.body) as Record<string, unknown>

  if (req.path === '/ticket-created') {
    return executeTicketCreated({ ...props, body })
  }

  if (req.path === '/ticket-updated') {
    return executeTicketUpdated({ ...props, body })
  }

  if (req.path === '/agent-replied') {
    return executeAgentReplied({ ...props, body })
  }
}
