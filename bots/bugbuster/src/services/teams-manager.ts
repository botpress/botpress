import * as lin from '../utils/linear-utils'
import * as bp from '.botpress'

export class TeamsManager {
  public constructor(
    private _linear: lin.LinearApi,
    private _client: bp.Client,
    private _botId: string
  ) {}

  public async addWatchedTeam(key: string): Promise<void> {
    const teamKeys = await this._getWatchedTeams()
    if (teamKeys.includes(key)) {
      throw new Error(`The team with the key '${key}' is already being watched.`)
    }
    if (!(await this._linear.isTeam(key))) {
      throw new Error(`The team with the key '${key}' does not exist.`)
    }

    await this._setWatchedTeams([...teamKeys, key])
  }

  public async removeWatchedTeam(key: string): Promise<void> {
    const teamKeys = await this._getWatchedTeams()
    if (!teamKeys.includes(key)) {
      throw new Error(`The team with the key '${key}' is not currently being watched.`)
    }
    await this._setWatchedTeams(teamKeys.filter((team) => team !== key))
  }

  public async listWatchedTeams(): Promise<string[]> {
    const teamKeys = await this._getWatchedTeams()
    if (teamKeys.length === 0) {
      throw new Error('You have no watched teams.')
    }
    return teamKeys
  }

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
}
