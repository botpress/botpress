import { transformUser } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const listAgents: bp.IntegrationProps['actions']['listAgents'] = async ({ client: bpClient, ctx, input }) => {
  const zendeskClient = await getZendeskClient(bpClient, ctx)
  const agents = await zendeskClient.getAgents(input.isOnline)

  return {
    agents: agents.map(transformUser),
  }
}
