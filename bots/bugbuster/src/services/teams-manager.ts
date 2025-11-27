import * as lin from 'src/utils/linear-utils'
import * as bp from '.botpress'
import { Result } from 'src/types'

export class TeamsManager {
  public constructor(
    private _linear: lin.LinearApi,
    private _client: bp.Client,
    private _botId: string
  ) {}

  private _getWatchedTeams = async () => {
    return (
      await this._client.getOrSetState({
        id: this._botId,
        name: 'watchedTeams',
        type: 'bot',
        payload: {
          teamKeys: [],
        },
      })
    ).state.payload.teamKeys
  }

  private _setWatchedTeams = async (teamKeys: string[]) => {
    await this._client.setState({
      id: this._botId,
      name: 'watchedTeams',
      type: 'bot',
      payload: {
        teamKeys,
      },
    })
  }

  public async addTeam(key: string): Promise<Result<void>> {
    const teamKeys = await this._getWatchedTeams()
    if (teamKeys.includes(key)) {
      return {
        success: false,
        message: `Error: the team with the key '${key}' is already being watched.`,
      }
    }
    if (!this._linear.isTeam(key)) {
      return {
        success: false,
        message: `Error: the team with the key '${key}' does not exist.`,
      }
    }

    await this._setWatchedTeams([...teamKeys, key])
    return {
      success: true,
      message: `Success: the team with the key '${key}' has been added to the watched team list.`,
    }
  }

  public async removeTeam(key: string): Promise<Result<void>> {
    const teamKeys = await this._getWatchedTeams()
    if (!teamKeys.includes(key)) {
      return {
        message: `Error: the team with the key '${key}' is not currently being watched.`,
        success: false,
      }
    }

    await this._setWatchedTeams(teamKeys.filter((k) => k !== key))
    return {
      success: false,
      message: `Success: the team with the key '${key}' has been removed from the watched team list.`,
    }
  }

  public async listTeams(): Promise<string[]> {
    const teamKeys = await this._getWatchedTeams()
    if (teamKeys.length === 0) {
      throw new Error('You have no watched teams.')
    }
    return teamKeys
  }
}
