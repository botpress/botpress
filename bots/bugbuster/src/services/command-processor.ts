import * as types from '../types'
import { TeamsManager } from './teams-manager'
import { Client } from '.botpress'

const MISSING_ARGS_ERROR = 'More arguments are required with this command.'

export class CommandProcessor {
  public constructor(
    private _client: Client,
    private _teamsManager: TeamsManager,
    private _botId: string
  ) {}

  private _listTeams: types.CommandImplementation = async () => {
    const teams = await this._teamsManager.listWatchedTeams()
    return { success: true, message: teams.join(', ') }
  }

  private _addTeam: types.CommandImplementation = async ([team]: string[]) => {
    if (!team) {
      return { success: false, message: MISSING_ARGS_ERROR }
    }

    await this._teamsManager.addWatchedTeam(team)

    return {
      success: true,
      message: `Success: the team with the key '${team}' has been added to the watched team list.`,
    }
  }

  private _removeTeam: types.CommandImplementation = async ([team]: string[]) => {
    if (!team) {
      return { success: false, message: MISSING_ARGS_ERROR }
    }

    await this._teamsManager.removeWatchedTeam(team)

    return {
      success: true,
      message: `Success: the team with the key '${team}' has been removed from the watched team list.`,
    }
  }

  private _lintAll: types.CommandImplementation = async (_: string[], conversationId: string) => {
    await this._client.getOrCreateWorkflow({
      name: 'lintAll',
      input: {},
      discriminateByStatusGroup: 'active',
      conversationId,
      status: 'pending',
    })

    return {
      success: true,
      message: "Launched 'lintAll' workflow.",
    }
  }

  private _setNotifChannel: types.CommandImplementation = async ([channel]: string[]) => {
    if (!channel) {
      return { success: false, message: MISSING_ARGS_ERROR }
    }
    await this._client.setState({
      id: this._botId,
      name: 'notificationChannelName',
      type: 'bot',
      payload: { name: channel },
    })

    return {
      success: true,
      message: `Success. Notification channel is now set to ${channel}.`,
    }
  }

  private _getNotifChannel: types.CommandImplementation = async () => {
    const {
      state: {
        payload: { name },
      },
    } = await this._client.getOrSetState({
      id: this._botId,
      name: 'notificationChannelName',
      type: 'bot',
      payload: {},
    })

    let message = 'There is no set Slack notification channel.'
    if (name) {
      message = `The Slack notification channel is ${name}.`
    }

    return {
      success: true,
      message,
    }
  }

  public commandDefinitions: types.CommandDefinition[] = [
    {
      name: '#listTeams',
      implementation: this._listTeams,
    },
    {
      name: '#addTeam',
      implementation: this._addTeam,
      requiredArgs: ['teamName'],
    },
    {
      name: '#removeTeam',
      implementation: this._removeTeam,
      requiredArgs: ['teamName'],
    },
    {
      name: '#lintAll',
      implementation: this._lintAll,
    },
    {
      name: '#setNotifChannel',
      implementation: this._setNotifChannel,
      requiredArgs: ['channelName'],
    },
    {
      name: '#getNotifChannel',
      implementation: this._getNotifChannel,
    },
  ]
}
