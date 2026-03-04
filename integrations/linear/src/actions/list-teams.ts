import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const listTeams: bp.IntegrationProps['actions']['listTeams'] = async (args) => {
  const {
    input: {},
  } = args
  const linearClient = await getLinearClient(args)
  const teams = await linearClient.teams()

  return {
    teams: teams.nodes.map((x) => ({
      id: x.id,
      key: x.key,
      name: x.name,
      description: x.description,
      icon: x.icon,
    })),
  }
}
