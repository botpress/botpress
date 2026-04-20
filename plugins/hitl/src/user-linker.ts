import * as types from './types'

export type UserOverrides = { name?: string; email?: string; pictureUrl?: string }

export class UserLinker {
  public constructor(
    private _props: types.AnyHandlerProps,
    private _users: Record<string, types.ActionableUser> = {}
  ) {}

  public async getDownstreamUserId(upstreamUserId: string, upstreamUserOverrides?: UserOverrides): Promise<string> {
    let upstreamUser = this._users[upstreamUserId]
    if (!upstreamUser) {
      const fetchedUser = await this._props.users.getById({ id: upstreamUserId })
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

  private async _getExistingDownstreamUserId(upstreamUser: types.ActionableUser) {
    const downstreamUserId = upstreamUser?.tags?.downstream

    if (!downstreamUserId || upstreamUser?.tags?.integrationName !== this._props.interfaces.hitl.name) {
      return null
    }

    try {
      await this._props.users.getById({ id: downstreamUserId })
    } catch {
      return null
    }

    return downstreamUserId
  }

  private async _linkUser(upstreamUser: types.ActionableUser, upstreamUserOverrides?: UserOverrides) {
    // To access bot-level tags:
    const untypedUserTags: Record<string, string> = upstreamUser.tags

    // Call createUser in the hitl integration (zendesk, etc.):
    const { userId: downstreamUserId } = await this._props.actions.hitl.createUser({
      name: upstreamUserOverrides?.name ?? untypedUserTags['name'] ?? upstreamUser.name ?? 'Unknown User',
      pictureUrl: upstreamUserOverrides?.pictureUrl ?? untypedUserTags['pictureUrl'] ?? upstreamUser.pictureUrl,
      email: upstreamUserOverrides?.email ?? untypedUserTags['email'] ?? this._generateFakeEmail(upstreamUser),
    })
    const downstreamUser = await this._props.users.getById({ id: downstreamUserId })

    const [updatedUpstreamUser, updatedDownstreamUser] = await Promise.all([
      upstreamUser.update({
        tags: {
          downstream: downstreamUserId,
          integrationName: this._props.interfaces.hitl.name,
        },
      }),
      downstreamUser.update({
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

  private _generateFakeEmail(user: types.ActionableUser) {
    const botId = this._props.ctx.botId.replaceAll('_', '-')
    return `${user.id}@no-reply.${botId}.botpress.com`
  }
}
