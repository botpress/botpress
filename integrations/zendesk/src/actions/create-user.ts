import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ ctx, client: bpClient, input }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)

  const { name, email, pictureUrl } = input
  const { user } = await bpClient.getOrCreateUser({
    name,
    pictureUrl,
    tags: {
      email,
      role: 'end-user',
    },
    discriminateByTags: ['email'],
  })

  const zendeskUser = await zendeskClient.createOrUpdateUser({
    role: 'end-user',
    external_id: user.id,
    name,
    email,
    remote_photo_url: pictureUrl,
  })

  await bpClient.updateUser({
    id: user.id,
    name,
    pictureUrl,
    tags: {
      id: `${zendeskUser.id}`,
    },
  })

  return {
    userId: user.id,
  }
}
