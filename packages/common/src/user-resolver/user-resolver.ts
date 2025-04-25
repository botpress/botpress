import type { User } from '@botpress/client'

export type UserResolver<TUser extends User = User> = {
  getUser: (props: { id: TUser['id'] }) => Promise<{ user: TUser }>
}

export class UserResolverWithCaching<TUser extends User = User> implements UserResolver<TUser> {
  private readonly _userCache = new Map<TUser['id'], TUser>()

  public constructor(private readonly _client: { getUser: (props: { id: TUser['id'] }) => Promise<{ user: TUser }> }) {}

  public async getUser({ id: userId }: { id: TUser['id'] }): Promise<{ user: TUser }> {
    const cachedUser = this._userCache.get(userId)

    if (cachedUser) {
      return { user: cachedUser }
    }

    const { user } = await this._client.getUser({ id: userId })
    this._userCache.set(userId, user)

    return { user }
  }
}
