import { transformUser } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const listAgents: bp.IntegrationProps['actions']['listAgents'] = async (props) => {
  const { client: bpClient, ctx, input, logger } = props
  const zendeskClient = await getZendeskClient(bpClient, ctx, logger)
  const agents = await zendeskClient.getAgents(input.isOnline)

  return {
    agents: agents.map(transformUser),
  }
}
