import * as bp from '.botpress'

type HandlerProps = Parameters<bp.IntegrationProps['handler']>[0]

export const executeAgentReplied = async (props: HandlerProps & { body: Record<string, unknown> }) => {
  const { client, body } = props

  await client.createEvent({
    type: 'agentReplied',
    payload: {
      ticket: body['ticket'] as bp.events.agentReplied.AgentReplied['ticket'],
      reply: body['reply'] as bp.events.agentReplied.AgentReplied['reply'],
    },
  })
}
