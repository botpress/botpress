import * as client from '@botpress/client'
import * as types from './types'

export type UserOverrides = { name?: string; email?: string; pictureUrl?: string }

export class UserLinker {
  public constructor(
    private _props: types.AnyHandlerProps,
    private _users: Record<string, client.User> = {}
  ) {}

  public async getDownstreamUserId(upstreamUserId: string, upstreamUserOverrides?: UserOverrides): Promise<string> {
    let upstreamUser = this._users[upstreamUserId]
    if (!upstreamUser) {
      const { user: fetchedUser } = await this._props.client.getUser({ id: upstreamUserId })
      this._users[upstreamUserId] = fetchedUser
      upstreamUser = fetchedUser
    }

    const existingDownstreamUserId = await this._getExistingDownstreamUserId(upstreamUser)

    if (existingDownstreamUserId !== null) {
      return existingDownstreamUserId
    }

    const {
      downstreamUser: { id: downstreamUserId },
      upstreamUser: updatedUpstreamUser,
    } = await this._linkUser(upstreamUser, upstreamUserOverrides)

    this._users[upstreamUserId] = updatedUpstreamUser

    return downstreamUserId
  }

  private async _getExistingDownstreamUserId(upstreamUser: client.User) {
    const downstreamUserId = upstreamUser?.tags?.downstream

    if (!downstreamUserId || upstreamUser?.tags?.integrationName !== this._props.interfaces.hitl.name) {
      return null
    }

    try {
      await this._props.client.getUser({ id: downstreamUserId })
    } catch {
      return null
    }

    return downstreamUserId
  }

  private async _linkUser(upstreamUser: client.User, upstreamUserOverrides?: UserOverrides) {
    // Call createUser in the hitl integration (zendesk, etc.):
    const { userId: downstreamUserId } = await this._props.actions.hitl.createUser({
      name: upstreamUserOverrides?.name ?? upstreamUser.tags['name'] ?? upstreamUser.name ?? 'Unknown User',
      pictureUrl: upstreamUserOverrides?.pictureUrl ?? upstreamUser.tags['pictureUrl'] ?? upstreamUser.pictureUrl,
      email:
        upstreamUserOverrides?.email ??
        upstreamUser.tags['email'] ??
        upstreamUser.tags.email ??
        this._generateFakeEmail(upstreamUser),
    })

    const [{ user: updatedUpstreamUser }, { user: updatedDownstreamUser }] = await Promise.all([
      this._props.client.updateUser({
        id: upstreamUser.id,
        tags: {
          downstream: downstreamUserId,
          integrationName: this._props.interfaces.hitl.name,
        },
      }),
      this._props.client.updateUser({
        id: downstreamUserId,
        tags: {
          upstream: upstreamUser.id,
          integrationName: this._props.interfaces.hitl.name,
        },
      }),
    ])

    return {
      upstreamUser: updatedUpstreamUser,
      downstreamUser: updatedDownstreamUser,
    }
  }

  private _generateFakeEmail(user: client.User) {
    const botId = this._props.ctx.botId.replaceAll('_', '-')
    return `${user.id}@${botId}.botpress.invalid`
  }
}
