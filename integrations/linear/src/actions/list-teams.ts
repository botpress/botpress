import { getLinearClient } from '../misc/utils'
import { IntegrationProps } from '.botpress'

export const listTeams: IntegrationProps['actions']['listTeams'] = async ({ client, ctx, input: {} }) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)
  const teams = await linearClient.teams()

  return {
    teams: teams.nodes.map((x) => ({
      id: x.id,
      name: x.name,
      description: x.description,
      icon: x.icon,
    })),
  }
}
