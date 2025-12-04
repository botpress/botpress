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

  public listTeams: types.CommandImplementation = async (): Promise<types.CommandResult> => {
    const teams = await this._teamsManager.listWatchedTeams()
    return { success: true, message: teams.join(', ') }
  }

  public addTeam: types.CommandImplementation = async (args: string[]): Promise<types.CommandResult> => {
    if (!args[0]) {
      return { success: false, message: MISSING_ARGS_ERROR }
    }

    await this._teamsManager.addWatchedTeam(args[0])

    return {
      success: true,
      message: `Success: the team with the key '${args[0]}' has been added to the watched team list.`,
    }
  }

  public removeTeam: types.CommandImplementation = async (args: string[]): Promise<types.CommandResult> => {
    if (!args[0]) {
      return { success: false, message: MISSING_ARGS_ERROR }
    }

    await this._teamsManager.removeWatchedTeam(args[0])

    return {
      success: true,
      message: `Success: the team with the key '${args[0]}' has been removed from the watched team list.`,
    }
  }

  public lintAll: types.CommandImplementation = async (
    _: string[],
    conversationId: string
  ): Promise<types.CommandResult> => {
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

  public setNotifChannel: types.CommandImplementation = async (args: string[]): Promise<types.CommandResult> => {
    if (!args[0]) {
      return { success: false, message: MISSING_ARGS_ERROR }
    }
    await this._client.setState({
      id: this._botId,
      name: 'notificationChannelName',
      type: 'bot',
      payload: { name: args[0] },
    })

    return {
      success: true,
      message: `Success. Notification channel is now set to ${args[0]}.`,
    }
  }

  public getNotifChannel: types.CommandImplementation = async (): Promise<types.CommandResult> => {
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
      implementation: this.listTeams,
      requiredArgsCount: 0,
    },
    {
      name: '#addTeam',
      implementation: this.addTeam,
      requiredArgsCount: 1,
    },
    {
      name: '#removeTeam',
      implementation: this.removeTeam,
      requiredArgsCount: 1,
    },
    {
      name: '#lintAll',
      implementation: this.lintAll,
      requiredArgsCount: 0,
    },
    {
      name: '#setNotifChannel',
      implementation: this.setNotifChannel,
      requiredArgsCount: 1,
    },
    {
      name: '#getNotifChannel',
      implementation: this.getNotifChannel,
      requiredArgsCount: 0,
    },
  ]
}
