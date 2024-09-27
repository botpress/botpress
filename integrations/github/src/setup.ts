import { GitHubClient } from './misc/github-client'
import { RegisterFunction, UnregisterFunction } from './misc/types'
import { configureBotpressNameAndAvatar, configureOrganizationHandle } from './misc/utils'

export const register: RegisterFunction = async ({ ctx, client }) => {
  const gh = await GitHubClient.create({ ctx, client })

  await configureBotpressNameAndAvatar({ ctx, client, gh })
  await configureOrganizationHandle({ ctx, client, gh })
}

export const unregister: UnregisterFunction = async (_) => {}
