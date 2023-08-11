import { Implementation } from '../misc/types'
import { getLinearClient } from '../misc/utils'

export const listTeams: Implementation['actions']['listTeams'] = async ({ client, ctx, input: {} }) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)
  const teams = await linearClient.teams()

  return { teams: teams.nodes.map((x) => ({ id: x.id, name: x.name })) }
}
