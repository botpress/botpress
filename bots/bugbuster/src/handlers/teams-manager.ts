import { LinearApi } from 'src/utils/linear-utils'
import * as bp from '.botpress'

export type Result = {
  success: boolean
  message: string
}

async function getTeamKeys(client: bp.Client, botId: string) {
  return (
    await client.getOrSetState({
      id: botId,
      name: 'teamsToWatch',
      type: 'bot',
      payload: {
        teamKeys: [],
      },
    })
  ).state.payload.teamKeys
}

async function setTeamKeys(client: bp.Client, botId: string, teamKeys: string[]) {
  await client.setState({
    id: botId,
    name: 'teamsToWatch',
    type: 'bot',
    payload: {
      teamKeys,
    },
  })
}

export async function addTeam(client: bp.Client, botId: string, key: string, linear: LinearApi): Promise<Result> {
  const teamKeys = await getTeamKeys(client, botId)
  if (teamKeys.includes(key)) {
    return {
      success: false,
      message: `Error: the team with the key '${key}' is already being watched.`,
    }
  }
  if (!linear.isTeam(key)) {
    return {
      success: false,
      message: `Error: the team with the key '${key}' does not exist.`,
    }
  }

  await setTeamKeys(client, botId, [...teamKeys, key])
  return {
    success: true,
    message: `Success: the team with the key '${key}' has been added to the watched team list.`,
  }
}

export async function removeTeam(client: bp.Client, botId: string, key: string): Promise<Result> {
  const teamKeys = await getTeamKeys(client, botId)
  if (!teamKeys.includes(key)) {
    return {
      message: `Error: the team with the key '${key}' is not currently being watched.`,
      success: false,
    }
  }

  await setTeamKeys(
    client,
    botId,
    teamKeys.filter((k) => k !== key)
  )
  return {
    success: false,
    message: `Success: the team with the key '${key}' has been removed from the watched team list.`,
  }
}

export async function listAllTeams(linear: LinearApi): Promise<Result> {
  return {
    success: true,
    message: linear.listAllTeams().join(', '),
  }
}

export async function listWatchedTeams(client: bp.Client, botId: string): Promise<Result> {
  const teamKeys = await getTeamKeys(client, botId)
  if (teamKeys.length === 0) {
    return {
      success: false,
      message: 'There are no watched teams.',
    }
  }
  return {
    success: true,
    message: teamKeys.join(', '),
  }
}
