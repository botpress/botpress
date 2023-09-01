import z from 'zod'

import { UserProfile } from '../definitions/schemas'
import { getLinearClient } from '../misc/utils'
import { IntegrationProps } from '.botpress'

export const getUser: IntegrationProps['actions']['getUser'] = async ({ client, ctx, input: { linearUserId } }) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)
  const user = await linearClient.user(linearUserId)

  return UserProfile.parse({
    linearId: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    admin: user.admin,
    createdAt: user.createdAt.toISOString(),
    displayName: user.displayName,
    guest: user.guest,
    isMe: user.isMe,
    url: user.url,
    archivedAt: user.archivedAt?.toISOString(),
    description: user.description,
    timezone: user.timezone,
  } satisfies z.infer<typeof UserProfile>)
}
