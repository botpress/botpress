import { transformUser } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import { IntegrationProps } from '.botpress'

export const listAgents: IntegrationProps['actions']['listAgents'] = async ({ ctx, input }) => {
  const agents = await getZendeskClient(ctx.configuration).getAgents(input.isOnline)

  return {
    agents: agents.map(transformUser),
  }
}
