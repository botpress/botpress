import * as bp from '.botpress'

type Agent = {
  id?: string
  name?: string
}

export const getOrCreateAgentUser = async ({
  agent,
  client,
  ticketId,
}: {
  agent?: Agent
  client: bp.Client
  ticketId: number
}) => {
  const agentId = agent?.id?.trim() || `ticket:${ticketId}:unknown-agent`
  const agentName = agent?.name?.trim() || 'Freshdesk Agent'
  const { users } = await client.listUsers({ tags: { freshdeskAgentId: agentId } })

  return users[0]
    ? await client.updateUser({ ...users[0], name: agentName, tags: { ...users[0].tags, freshdeskAgentId: agentId } })
    : await client.createUser({ name: agentName, tags: { freshdeskAgentId: agentId } })
}
