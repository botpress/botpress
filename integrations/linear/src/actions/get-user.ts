import { z } from '@botpress/sdk'

import { userProfileSchema } from '../../definitions/schemas'
import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const getUser: bp.IntegrationProps['actions']['getUser'] = async (args) => {
  const {
    ctx,
    input: { linearUserId },
  } = args
  const linearClient = await getLinearClient(args, ctx.integrationId)
  const user = await linearClient.user(linearUserId)

  return userProfileSchema.parse({
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
  } satisfies z.infer<typeof userProfileSchema>)
}
