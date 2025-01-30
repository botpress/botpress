import * as client from '@botpress/client'
import * as types from './types'

export class UserLinker {
  public constructor(
    private _props: types.HandlerProps,
    private _users: Record<string, client.User> = {}
  ) {}

  public async getDownstreamUserId(upstreamUserId: string): Promise<string> {
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
    } = await this._linkUser(upstreamUser)

    this._users[upstreamUserId] = updatedUpstreamUser

    return downstreamUserId
  }

  private async _linkUser(upstreamUser: client.User) {
    const { userId: downstreamUserId } = await this._props.actions.hitl.createUser({
      name: upstreamUser.name,
      pictureUrl: upstreamUser.pictureUrl,
      email: upstreamUser.tags.email,
    })

    const { user: updatedUpstreamUser } = await this._props.client.updateUser({
      id: upstreamUser.id,
      tags: {
        downstream: downstreamUserId,
      },
    })

    const { user: updatedDownstreamUser } = await this._props.client.updateUser({
      id: downstreamUserId,
      tags: {
        upstream: upstreamUser.id,
      },
    })

    return {
      upstreamUser: updatedUpstreamUser,
      downstreamUser: updatedDownstreamUser,
    }
  }
}
