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

  private _addNotifChannel: types.CommandImplementation = async ([channelToAdd, ...teams]: string[]) => {
    if (!channelToAdd || !teams[0]) {
      return { success: false, message: MISSING_ARGS_ERROR }
    }

    const {
      state: {
        payload: { channels },
      },
    } = await this._client.getOrSetState({
      id: this._botId,
      name: 'notificationChannels',
      type: 'bot',
      payload: { channels: [] },
    })

    const watchedTeams = await this._teamsManager.listWatchedTeams()
    if (!teams.every((team) => watchedTeams.includes(team))) {
      return {
        success: false,
        message: 'make sure every team you want to add is being watched.',
      }
    }

    const existingChannel = channels.find((channel) => channel.name === channelToAdd)
    if (!existingChannel) {
      const conversation = await this._client.callAction({
        type: 'slack:startChannelConversation',
        input: { channelName: channelToAdd },
      })
      channels.push({ conversationId: conversation.output.conversationId, name: channelToAdd, teams })
    } else {
      teams.forEach((team) => {
        if (!existingChannel.teams.includes(team)) {
          existingChannel.teams.push(team)
        }
      })
    }

    await this._client.setState({
      id: this._botId,
      name: 'notificationChannels',
      type: 'bot',
      payload: { channels },
    })

    return {
      success: true,
      message: `Notifications for team(s) ${teams.join(', ')} will be posted in channel ${channelToAdd}.`,
    }
  }

  private _removeNotifChannel: types.CommandImplementation = async ([channelToRemove]: string[]) => {
    if (!channelToRemove) {
      return { success: false, message: MISSING_ARGS_ERROR }
    }

    const {
      state: {
        payload: { channels },
      },
    } = await this._client.getOrSetState({
      id: this._botId,
      name: 'notificationChannels',
      type: 'bot',
      payload: { channels: [] },
    })

    if (!channels.find((channel) => channel.name === channelToRemove)) {
      return {
        success: false,
        message: `channel '${channelToRemove}' is not part of the notification channels.`,
      }
    }

    await this._client.setState({
      id: this._botId,
      name: 'notificationChannels',
      type: 'bot',
      payload: { channels: channels.filter((channel) => channel.name !== channelToRemove) },
    })

    return {
      success: true,
      message: `Notification channel ${channelToRemove} has been removed.`,
    }
  }

  private _removeNotifChannelTeam: types.CommandImplementation = async ([channelToRemove, teamToRemove]: string[]) => {
    if (!channelToRemove || !teamToRemove) {
      return { success: false, message: MISSING_ARGS_ERROR }
    }

    const {
      state: {
        payload: { channels },
      },
    } = await this._client.getOrSetState({
      id: this._botId,
      name: 'notificationChannels',
      type: 'bot',
      payload: { channels: [] },
    })

    const channel = channels.find((channel) => channel.name === channelToRemove)
    if (!channel) {
      return {
        success: false,
        message: `channel '${channelToRemove}' is not part of the notification channels.`,
      }
    }

    if (!channel.teams.find((team) => team === teamToRemove)) {
      return {
        success: false,
        message: `channel ${channel.name} does not receive notifications from team '${teamToRemove}'.`,
      }
    }

    channel.teams = channel.teams.filter((team) => team !== teamToRemove)

    await this._client.setState({
      id: this._botId,
      name: 'notificationChannels',
      type: 'bot',
      payload: { channels },
    })

    return {
      success: true,
      message: `Team ${teamToRemove} has been removed from channel ${channelToRemove}.`,
    }
  }

  private _listNotifChannels: types.CommandImplementation = async () => {
    const {
      state: {
        payload: { channels },
      },
    } = await this._client.getOrSetState({
      id: this._botId,
      name: 'notificationChannels',
      type: 'bot',
      payload: { channels: [] },
    })

    let message = 'There is no set Slack notification channel.'
    if (channels.length > 0) {
      message = this._buildNotifChannelsMessage(channels)
    }

    return {
      success: true,
      message,
    }
  }

  private _buildNotifChannelsMessage(channels: { name: string; teams: string[] }[]) {
    return `The Slack notification channels are:\n${channels.map(this._getMessageForChannel).join('\n')}`
  }

  private _getMessageForChannel(channel: { name: string; teams: string[] }) {
    const { name, teams } = channel
    return `- channel ${name} for team(s) ${teams.join(', ')}`
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
      name: '#addNotifChannel',
      implementation: this._addNotifChannel,
      requiredArgs: ['channelName', 'teamName1'],
      optionalArgs: ['teamName2 ...'],
    },
    {
      name: '#removeNotifChannel',
      implementation: this._removeNotifChannel,
      requiredArgs: ['channelName'],
    },
    {
      name: '#removeNotifChannelTeam',
      implementation: this._removeNotifChannelTeam,
      requiredArgs: ['channelName', 'teamName'],
    },
    {
      name: '#listNotifChannels',
      implementation: this._listNotifChannels,
    },
  ]
}
