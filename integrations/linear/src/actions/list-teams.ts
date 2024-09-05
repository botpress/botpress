import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const listTeams: bp.IntegrationProps['actions']['listTeams'] = async (args) => {
  const {
    ctx,
    input: {},
  } = args
  const linearClient = await getLinearClient(args, ctx.integrationId)
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
