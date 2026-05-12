import * as bp from '.botpress'
import { normalizeTicket } from './normalizeTicket'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeAgentReplied = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body } = props

  await client.createEvent({
    type: 'agentReplied',
    payload: {
      ticket: normalizeTicket(body['ticket'] as Record<string, unknown>) as bp.events.agentReplied.AgentReplied['ticket'],
      reply: body['reply'] as bp.events.agentReplied.AgentReplied['reply'],
    },
  })
}
