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

    if (upstreamUser.tags.downstream) {
      return upstreamUser.tags.downstream
    }

    const {
      downstreamUser: { id: downstreamUserId },
      upstreamUser: updatedUpstreamUser,
    } = await this._linkUser(upstreamUser, upstreamUserOverrides)

    this._users[upstreamUserId] = updatedUpstreamUser

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
        'anonymous@noemail.com',
    })

    const [{ user: updatedUpstreamUser }, { user: updatedDownstreamUser }] = await Promise.all([
      this._props.client.updateUser({
        id: upstreamUser.id,
        tags: {
          downstream: downstreamUserId,
        },
      }),
      this._props.client.updateUser({
        id: downstreamUserId,
        tags: {
          upstream: upstreamUser.id,
        },
      }),
    ])

    return {
      upstreamUser: updatedUpstreamUser,
      downstreamUser: updatedDownstreamUser,
    }
  }
}
