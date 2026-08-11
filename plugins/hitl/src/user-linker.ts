import { callBackingIntegrationAction, type HitlBackingIntegration } from './backing-integration'
import * as types from './types'

export type UserOverrides = { name?: string; email?: string; pictureUrl?: string }

export class UserLinker {
  public constructor(
    private _props: types.AnyHandlerProps,
    private _backingIntegration: HitlBackingIntegration,
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
    // A user carrying only the legacy integrationName tag is treated as
    // unlinked: one redundant user creation on the backing integration is the
    // safe direction.
    const isLinkedToCurrentIntegration = upstreamUser?.tags?.integrationAlias === this._backingIntegration.alias

    if (!downstreamUserId || !isLinkedToCurrentIntegration) {
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

    const { userId: downstreamUserId } = await callBackingIntegrationAction({
      client: this._props.client,
      backingIntegration: this._backingIntegration,
      name: 'createUser',
      input: {
        name: upstreamUserOverrides?.name ?? untypedUserTags['name'] ?? upstreamUser.name ?? 'Unknown User',
        pictureUrl: upstreamUserOverrides?.pictureUrl ?? untypedUserTags['pictureUrl'] ?? upstreamUser.pictureUrl,
        email: upstreamUserOverrides?.email ?? untypedUserTags['email'] ?? this._generateFakeEmail(upstreamUser),
      },
    })
    const downstreamUser = await this._props.users.getById({ id: downstreamUserId })

    // The integrationName tag only has a defined value when the backing
    // integration is the compiled interface dependency; after a switch only
    // the alias is known:
    const integrationNameTag =
      this._backingIntegration.alias === this._props.interfaces.hitl.integrationAlias
        ? { integrationName: this._props.interfaces.hitl.name }
        : {}

    const [updatedUpstreamUser, updatedDownstreamUser] = await Promise.all([
      upstreamUser.update({
        tags: {
          downstream: downstreamUserId,
          integrationAlias: this._backingIntegration.alias,
          ...integrationNameTag,
        },
      }),
      downstreamUser.update({
        tags: {
          upstream: upstreamUser.id,
          integrationAlias: this._backingIntegration.alias,
          ...integrationNameTag,
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
